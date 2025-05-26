import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db'; // Assuming prisma client is at lib/db
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client'; // For error handling

if (!process.env.PATIENT_JWT_SECRET) {
  // This check is important for server startup or first request in dev
  // In production, the build should fail or server shouldn't start if critical env vars are missing.
  console.error("FATAL ERROR: PATIENT_JWT_SECRET is not defined in .env");
  // throw new Error("PATIENT_JWT_SECRET is not defined."); // Option to make it fatal
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { email, name } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ message: 'Valid email is required' });
  }
  if (name && typeof name !== 'string') {
    // Name is optional, but if provided, it should be a string
    return res.status(400).json({ message: 'Name, if provided, must be a string' });
  }

  // Ensure PATIENT_JWT_SECRET is available at runtime
  const patientJwtSecret = process.env.PATIENT_JWT_SECRET;
  if (!patientJwtSecret) {
    console.error('PATIENT_JWT_SECRET is not available at runtime.');
    return res.status(500).json({ message: 'Authentication configuration error.' });
  }

  try {
    let patient = await prisma.patient.findUnique({
      where: { email },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          email,
          name: name || 'Patient', // Default name if not provided
          // phone can be added later if needed
        },
      });
      console.log(`Patient created: ${patient.id} - ${patient.email}`);
    } else {
      console.log(`Patient found: ${patient.id} - ${patient.email}`);
    }

    // Generate JWT for the patient
    const patientTokenPayload = {
      patientId: patient.id,
      email: patient.email,
      // Add any other relevant patient-specific claims
    };

    const token = jwt.sign(patientTokenPayload, patientJwtSecret, {
      expiresIn: '7d', // Patient sessions might be longer, adjust as needed
    });

    return res.status(200).json({
      message: patient ? 'Patient session initiated' : 'New patient session created',
      token,
      patient: {
        id: patient.id,
        email: patient.email,
        name: patient.name,
      },
    });

  } catch (error: any) {
    console.error('Patient session error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors if necessary, e.g., unique constraint if email wasn't checked with findUnique first
      // For example, if create fails due to a race condition on email uniqueness (though findUnique should prevent this)
      if (error.code === 'P2002') { // Unique constraint violation
        return res.status(409).json({ message: 'Error processing patient data. Please try again.' });
      }
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    // Prisma client disconnect is handled by the shared instance in @/lib/db.ts
    // await prisma.$disconnect(); // Not needed if using shared instance from lib/db.ts
  }
}
