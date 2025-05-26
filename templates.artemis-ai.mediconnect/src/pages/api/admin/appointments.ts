import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react'; // For checking staff session
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const session = await getSession({ req });

  // Check for staff role (admin or doctor)
  if (!session || !session.user || !['admin', 'doctor'].includes((session.user as any).role)) {
    return res.status(403).json({ message: 'Access Denied. Staff role required.' });
  }

  const { date: dateQuery } = req.query;

  if (!dateQuery || typeof dateQuery !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateQuery)) {
    return res.status(400).json({ message: 'A valid date parameter (YYYY-MM-DD) is required.' });
  }

  try {
    const targetDate = new Date(dateQuery);
    if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format provided.' });
    }

    // Set time to the beginning and end of the target date for accurate range filtering
    const startDate = new Date(targetDate);
    startDate.setUTCHours(0, 0, 0, 0); // Start of the day in UTC

    const endDate = new Date(targetDate);
    endDate.setUTCHours(23, 59, 59, 999); // End of the day in UTC
    
    console.log(`Admin fetching appointments for date: ${dateQuery}, UTC range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const appointments = await prisma.appointment.findMany({
      where: {
        startsAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
      include: { // Include patient details for admin view
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return res.status(200).json(appointments);

  } catch (error: any) {
    console.error(`Error fetching appointments for admin on date ${dateQuery}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors if needed
    }
    return res.status(500).json({ message: 'Internal Server Error while fetching appointments.' });
  }
};

export default handler; // Not wrapped with verifyPatientToken, uses NextAuth session
