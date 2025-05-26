import jwt from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

export interface AuthenticatedPatientRequest extends NextApiRequest {
  patient?: { patientId: string; email: string; }; // Define structure of decoded patient payload
}

const PATIENT_JWT_SECRET = process.env.PATIENT_JWT_SECRET;

if (!PATIENT_JWT_SECRET) {
  // This will log an error when the server starts or this module is first loaded if the secret is missing.
  // It helps in early detection of configuration issues.
  console.error("FATAL ERROR: PATIENT_JWT_SECRET is not defined in .env for verifyPatientToken middleware.");
  // Depending on deployment strategy, you might throw an error here to prevent startup,
  // but for Next.js API routes, a runtime check within the middleware is also crucial.
}

export const verifyPatientToken = (handler: NextApiHandler) =>
  async (req: AuthenticatedPatientRequest, res: NextApiResponse) => {
    if (!PATIENT_JWT_SECRET) {
      // Runtime fallback check
      console.error('PATIENT_JWT_SECRET not available at runtime in verifyPatientToken.');
      return res.status(500).json({ message: 'Authentication configuration error.' });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Patient authentication token required. Format is Bearer <token>.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Patient authentication token is missing.' });
    }

    try {
      const decoded = jwt.verify(token, PATIENT_JWT_SECRET) as { patientId: string; email: string; iat: number; exp: number };
      // Minimal check for expected properties after decoding
      if (!decoded || !decoded.patientId || !decoded.email) {
          throw new Error("Token payload is missing expected fields.");
      }
      req.patient = { patientId: decoded.patientId, email: decoded.email }; // Attach decoded patient payload
      return handler(req, res); // Proceed to the original handler
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Patient token expired.' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid patient token.' });
      }
      // For other errors, it might be a server issue or unexpected token structure
      console.error('Patient token verification error:', error.message);
      return res.status(401).json({ message: 'Error verifying patient token.' });
    }
};

// Example of how to protect an API route for patients:
// import { verifyPatientToken, AuthenticatedPatientRequest } from '@/lib/verifyPatientToken';
// import type { NextApiResponse } from 'next';
//
// const myPatientProtectedHandler = (req: AuthenticatedPatientRequest, res: NextApiResponse) => {
//   if (req.patient) {
//     res.status(200).json({ message: `Hello patient ${req.patient.patientId} (${req.patient.email})` });
//   }
// };
//
// export default verifyPatientToken(myPatientProtectedHandler);
