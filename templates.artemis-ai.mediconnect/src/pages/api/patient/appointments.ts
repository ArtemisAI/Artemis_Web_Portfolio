import type { NextApiResponse } from 'next';
import { verifyPatientToken, AuthenticatedPatientRequest } from '@/lib/verifyPatientToken';
import prisma from '@/lib/db';

const handler = async (req: AuthenticatedPatientRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  if (!req.patient || !req.patient.patientId) {
    // This should be caught by verifyPatientToken, but as a safeguard:
    return res.status(401).json({ message: 'Patient authentication required.' });
  }
  const { patientId } = req.patient;

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientId,
      },
      orderBy: {
        startsAt: 'asc', // Order by start time, ascending
      },
      // Optionally, include related data if needed, e.g., patient details (though redundant here)
      // include: { patient: true } 
    });

    return res.status(200).json(appointments);

  } catch (error: any) {
    console.error(`Error fetching appointments for patient ${patientId}:`, error);
    return res.status(500).json({ message: 'Internal Server Error while fetching appointments.' });
  }
};

export default verifyPatientToken(handler);
