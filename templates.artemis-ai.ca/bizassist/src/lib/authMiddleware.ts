import jwt from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

// Define the structure of your JWT payload
export interface JwtPayload {
  userId: string;
  email: string;
  tenant_id: string;
  role: string;
  // You can add other fields that you include in the JWT payload
}

// Extend NextApiRequest to include the decoded user from JWT
export interface AuthenticatedRequest extends NextApiRequest {
  user?: JwtPayload; 
}

// Ensure JWT_SECRET is set in environment variables for the middleware too
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // This will ideally stop the server from starting if the secret is missing,
  // preventing runtime errors in production.
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env for authMiddleware.');
  // For Next.js API routes, throwing an error here might not stop build/start,
  // so runtime checks within the middleware are also important.
}

export const authMiddleware = (handler: NextApiHandler) => 
  async (req: AuthenticatedRequest, res: NextApiResponse) => {
    if (!JWT_SECRET) {
      // Fallback if the server somehow started without JWT_SECRET
      console.error('JWT_SECRET not available in authMiddleware at runtime.');
      return res.status(500).json({ message: 'Authentication configuration error.' });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication token required.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is missing.' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = decoded; // Attach decoded user payload to the request object
      return handler(req, res); // Proceed to the original handler
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired.' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token.' });
      }
      // For other errors, it might be a server issue
      console.error('Token verification error:', error);
      return res.status(500).json({ message: 'Error verifying token.' });
    }
};

// Example of how to protect an API route:
// import { authMiddleware, AuthenticatedRequest } from '@/lib/authMiddleware';
// import type { NextApiResponse } from 'next';
//
// const myProtectedHandler = (req: AuthenticatedRequest, res: NextApiResponse) => {
//   // Now req.user is available and contains the JWT payload
//   if (req.user) {
//     res.status(200).json({ message: `Hello user ${req.user.userId} from tenant ${req.user.tenant_id}` });
//   } else {
//     // This case should ideally not be reached if middleware is working
//     res.status(401).json({ message: 'Unauthorized' });
//   }
// };
//
// export default authMiddleware(myProtectedHandler);
