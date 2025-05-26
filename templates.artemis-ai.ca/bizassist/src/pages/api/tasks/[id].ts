import type { NextApiResponse } from 'next';
import prisma from '@/lib/db'; // Import shared Prisma instance
import { authMiddleware, AuthenticatedRequest } from '@/lib/authMiddleware';

// const prisma = new PrismaClient(); // Remove per-file instantiation

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  if (!req.user || !req.user.tenant_id) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  const { tenant_id } = req.user;
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Task ID must be a string.' });
  }

  // Check if task exists and belongs to the tenant for GET, PUT, DELETE
  // This also helps prevent trying to operate on a non-existent task.
  const task = await prisma.task.findFirst({
    where: {
      id: id,
      tenantId: tenant_id,
    },
  });

  if (!task && req.method !== 'PUT') { // For PUT, we might create if not exists, but problem statement implies update of existing
    // Actually, for PUT, if it doesn't exist, it should be 404 as well.
    // The problem statement says "update the task", not "update or create".
    return res.status(404).json({ message: 'Task not found or access denied.' });
  }


  if (req.method === 'GET') {
    // Get Task by ID
    // The 'task' variable already holds the fetched task or null if not found (handled by the check above)
    return res.status(200).json(task);

  } else if (req.method === 'PUT') {
    // Update Task
    if (!task) { // Re-check specifically for PUT if the earlier check was modified
        return res.status(404).json({ message: 'Task not found or access denied for update.' });
    }
    const { title, dueAt, completed } = req.body;
    const updateData: { title?: string; dueAt?: Date; completed?: boolean } = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'Title must be a non-empty string.' });
      }
      updateData.title = title;
    }
    if (dueAt !== undefined) {
      if (typeof dueAt !== 'string' || isNaN(new Date(dueAt).getTime())) {
        return res.status(400).json({ message: 'Valid dueAt (ISO 8601 date string) is required for update.' });
      }
      updateData.dueAt = new Date(dueAt);
    }
    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'Completed status must be a boolean.' });
      }
      updateData.completed = completed;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    try {
      const updatedTask = await prisma.task.update({
        where: {
          id: id, 
          // tenantId: tenant_id, // Though `task` was already fetched with tenantId check, Prisma `update` needs unique id.
                                // The check for `task` existence already ensures tenant ownership.
        },
        data: updateData,
      });
      return res.status(200).json(updatedTask);
    } catch (error) {
      console.error('Update task error:', error);
      // Handle potential Prisma errors, e.g., if the record was deleted between findFirst and update
      return res.status(500).json({ message: 'Internal Server Error while updating task.' });
    }

  } else if (req.method === 'DELETE') {
    // Delete Task
     if (!task) { // Re-check specifically for DELETE
        return res.status(404).json({ message: 'Task not found or access denied for delete.' });
    }
    try {
      await prisma.task.delete({
        where: {
          id: id,
          // tenantId: tenant_id, // Similarly, `task` check ensures ownership. `delete` needs unique id.
        },
      });
      return res.status(204).end(); // No Content
    } catch (error) {
      console.error('Delete task error:', error);
      return res.status(500).json({ message: 'Internal Server Error while deleting task.' });
    }

  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
};

export default authMiddleware(handler);
