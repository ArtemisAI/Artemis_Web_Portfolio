import type { NextApiResponse } from 'next';
import prisma from '@/lib/db'; // Import shared Prisma instance
import { authMiddleware, AuthenticatedRequest } from '@/lib/authMiddleware';

// const prisma = new PrismaClient(); // Remove per-file instantiation

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (!req.user || !req.user.tenant_id) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  const { tenant_id } = req.user;

  if (req.method === 'POST') {
    // Create Task
    const { title, dueAt } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ message: 'Title is required and must be a string.' });
    }
    if (!dueAt || typeof dueAt !== 'string' || isNaN(new Date(dueAt).getTime())) {
      return res.status(400).json({ message: 'Valid dueAt (ISO 8601 date string) is required.' });
    }

    try {
      const newTask = await prisma.task.create({
        data: {
          title,
          dueAt: new Date(dueAt),
          tenantId: tenant_id,
          completed: false, // Default to not completed
        },
      });
      return res.status(201).json(newTask);
    } catch (error) {
      console.error('Create task error:', error);
      return res.status(500).json({ message: 'Internal Server Error while creating task.' });
    }

  } else if (req.method === 'GET') {
    // Get All Tasks
    try {
      const tasks = await prisma.task.findMany({
        where: {
          tenantId: tenant_id,
        },
        orderBy: {
          createdAt: 'desc', // Optional: order by creation date
        },
      });
      return res.status(200).json(tasks);
    } catch (error) {
      console.error('Get all tasks error:', error);
      return res.status(500).json({ message: 'Internal Server Error while fetching tasks.' });
    }

  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
};

// Disconnect Prisma client when the server is shutting down or for testing purposes
// This is a simplified approach; for serverless functions, Prisma recommends specific patterns.
// process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
// process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });
// Note: For Next.js API routes, direct $disconnect in the handler's finally block is often better.
// However, since PrismaClient is instantiated outside, a global disconnect isn't straightforward here
// without a shared instance management. For now, we'll rely on Prisma's internal connection management.
// A more robust solution might involve a singleton Prisma instance from a separate lib file.

export default authMiddleware(handler);
