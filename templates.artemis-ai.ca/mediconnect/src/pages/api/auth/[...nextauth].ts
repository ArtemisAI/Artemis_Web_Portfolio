import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/db'; // Assuming prisma client is exported from lib/db
import bcrypt from 'bcryptjs';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Please define NEXTAUTH_SECRET environment variable");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "staff@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Auth: Missing email or password in credentials');
          return null; // Or throw an error
        }

        try {
          const staff = await prisma.staff.findUnique({
            where: { email: credentials.email }
          });

          if (staff && staff.password_hash) {
            const isPasswordValid = await bcrypt.compare(credentials.password, staff.password_hash);
            if (isPasswordValid) {
              // Return user object that will be encoded in the JWT
              console.log(`Auth: User ${staff.email} authenticated successfully.`);
              return { 
                id: staff.id, 
                email: staff.email, 
                name: staff.name,
                role: staff.role 
                // tenant_id is not in Staff model per schema
              };
            } else {
              console.log(`Auth: Invalid password for user ${credentials.email}.`);
              return null;
            }
          } else {
            console.log(`Auth: No staff found with email ${credentials.email}.`);
            return null;
          }
        } catch (error) {
          console.error("Auth: Error in authorize function:", error);
          return null; // Or throw an error to show a generic message
        }
      }
    })
  ],
  session: {
    strategy: 'jwt', // Use JSON Web Tokens for session management
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    // You can also define encode/decode functions if using a different JWT library or more complex tokens
  },
  callbacks: {
    async jwt({ token, user }) { // 'account' is available on initial sign-in but not strictly needed here
      if (user) { // user object is available only on sign-in / when new token is created
        token.id = user.id; // user.id comes from the object returned by authorize
        token.role = (user as { role?: string }).role; // Ensure 'role' is typed or cast
      }
      return token;
    },
    async session({ session, token }) {
      // token object contains what we put in the jwt callback
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string;
        (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login', // Optional: custom login page
    // error: '/auth/error', // Optional: custom error page
  },
  // Enable debug messages in the console if you are having problems
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
