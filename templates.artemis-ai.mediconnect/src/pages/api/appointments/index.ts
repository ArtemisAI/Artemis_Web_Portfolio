import type { NextApiResponse } from 'next';
import { verifyPatientToken, AuthenticatedPatientRequest } from '@/lib/verifyPatientToken';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

const handler = async (req: AuthenticatedPatientRequest, res: NextApiResponse) => {
  // Patient authentication is required for all methods in this handler for now.
  // The GET method will be refactored later to distinguish between patient and admin.
  if (!req.patient || !req.patient.patientId) {
    return res.status(401).json({ message: 'Patient authentication required.' });
  }
  const { patientId } = req.patient;

  if (req.method === 'POST') {
    // Create/Book Appointment
    const { startsAt, endsAt, reason } = req.body;

    // Basic Input Validation
    if (!startsAt || typeof startsAt !== 'string' || isNaN(new Date(startsAt).getTime())) {
      return res.status(400).json({ message: 'Valid startsAt (ISO 8601 date string) is required.' });
    }
    if (!endsAt || typeof endsAt !== 'string' || isNaN(new Date(endsAt).getTime())) {
      return res.status(400).json({ message: 'Valid endsAt (ISO 8601 date string) is required.' });
    }
    if (new Date(startsAt) >= new Date(endsAt)) {
      return res.status(400).json({ message: 'endsAt must be after startsAt.' });
    }
    if (reason && typeof reason !== 'string') {
      return res.status(400).json({ message: 'Reason, if provided, must be a string.' });
    }
    // Add more validation as needed (e.g., check for future dates, time conflicts, etc.)

    try {
      const newAppointment = await prisma.appointment.create({
        data: {
          patientId: patientId,
          startsAt: new Date(startsAt),
          endsAt: new Date(endsAt),
          reason: reason || null,
          status: 'pending', // Default status
        },
      });
      return res.status(201).json(newAppointment);
    } catch (error: any) {
      console.error(`Error creating appointment for patient ${patientId}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors if needed
        // e.g., if there are constraints like one pending appointment at a time per patient
      }
      return res.status(500).json({ message: 'Internal Server Error while booking appointment.' });
    }
  } else {
    // For now, other methods are not allowed on this specific file.
    // GET will be handled by separate files as per subtask decision.
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed on this endpoint.` });
  }
};

export default verifyPatientToken(handler);
