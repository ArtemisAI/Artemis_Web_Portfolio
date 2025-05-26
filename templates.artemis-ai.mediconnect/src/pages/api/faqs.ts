import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db'; // Using the shared Prisma client
import { Prisma } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    const faqs = await prisma.fAQ.findMany({
      // Optionally, you can order them, e.g., by category or a specific order field if added
      // orderBy: { category: 'asc' } 
    });

    return res.status(200).json(faqs);

  } catch (error: any) {
    console.error('Error fetching FAQs:', error);
    // Handle potential Prisma errors if needed, though findMany is less likely to throw specific known errors
    // unless there's a database connection issue.
    if (error instanceof Prisma.PrismaClientInitializationError) {
        return res.status(503).json({ message: 'Service Unavailable: Cannot connect to database.'});
    }
    return res.status(500).json({ message: 'Internal Server Error while fetching FAQs.' });
  }
}
