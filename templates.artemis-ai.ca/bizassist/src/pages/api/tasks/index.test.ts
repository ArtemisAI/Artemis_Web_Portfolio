import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks, RequestMethod } from 'node-mocks-http';
import tasksHandler from './index'; // Adjust path to your tasks handler
import prisma from '@/lib/db'; // Will be mocked
import jwt from 'jsonwebtoken'; // To mock authMiddleware behavior

// Mock the actual authMiddleware to control req.user
vi.mock('@/lib/authMiddleware', () => ({
  authMiddleware: (handler: any) => async (req: any, res: any) => {
    // Simulate token verification and user attachment
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        // In a real test, you might not verify the actual JWT secret
        // but rather just check if a token exists and attach a mock user.
        // For this example, let's assume a valid token leads to a mock user.
        // Or, we can mock jwt.verify directly if needed.
        if (token === 'test-jwt-token') {
          req.user = { // Mock user payload
            userId: 'test-user-id',
            email: 'test@example.com',
            tenant_id: 'test-tenant-id',
            role: 'user',
          };
        } else if (token === 'invalid-token') {
          // Let the actual middleware logic (if not fully mocked out) or this mock handle it
           return res.status(401).json({ message: 'Invalid token (mocked)' });
        }
      } catch (e) {
        // Mocked error or pass through
      }
    }
    // If req.user is not set by this mock (e.g. no token), the handler should deny access
    return handler(req, res);
  },
  // Export other things if your original module does
}));

// Mock Prisma client specifically for these tests
const mockPrismaTasks = {
  task: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
};
vi.mock('@/lib/db', () => ({
  default: mockPrismaTasks,
  prisma: mockPrismaTasks,
}));


describe('/api/tasks (index)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task for an authenticated user', async () => {
      const taskData = { title: 'New Test Task', dueAt: new Date().toISOString() };
      const createdTask = { ...taskData, id: 'task1', tenantId: 'test-tenant-id', completed: false, createdAt: new Date() };
      mockPrismaTasks.task.create.mockResolvedValue(createdTask);

      const { req, res } = createMocks({
        method: 'POST' as RequestMethod,
        headers: {
          authorization: 'Bearer test-jwt-token', // Simulate valid token
        },
        body: taskData,
      });

      await tasksHandler(req as any, res as any);

      expect(res._getStatusCode()).toBe(201);
      expect(res._getJSONData()).toEqual(createdTask);
      expect(mockPrismaTasks.task.create).toHaveBeenCalledWith({
        data: {
          title: taskData.title,
          dueAt: new Date(taskData.dueAt),
          tenantId: 'test-tenant-id', // From mocked req.user
          completed: false,
        },
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      const { req, res } = createMocks({
        method: 'POST' as RequestMethod,
        body: { title: 'New Task', dueAt: new Date().toISOString() },
        // No authorization header
      });

      await tasksHandler(req as any, res as any);
      expect(res._getStatusCode()).toBe(401);
      expect(res._getJSONData().message).toBe('Authentication required.');
    });
    
    it('should return 400 for invalid task data', async () => {
      const { req, res } = createMocks({
        method: 'POST' as RequestMethod,
        headers: { authorization: 'Bearer test-jwt-token' },
        body: { title: '', dueAt: 'invalid-date' }, // Invalid data
      });

      await tasksHandler(req as any, res as any);
      expect(res._getStatusCode()).toBe(400);
      // Specific message depends on your validation order
      expect(res._getJSONData().message).toBe('Title is required and must be a string.');
    });
  });

  describe('GET /api/tasks', () => {
    it('should retrieve all tasks for an authenticated user', async () => {
      const mockTasks = [
        { id: 'task1', title: 'Task 1', tenantId: 'test-tenant-id', completed: false, dueAt: new Date() },
        { id: 'task2', title: 'Task 2', tenantId: 'test-tenant-id', completed: true, dueAt: new Date() },
      ];
      mockPrismaTasks.task.findMany.mockResolvedValue(mockTasks);

      const { req, res } = createMocks({
        method: 'GET' as RequestMethod,
        headers: {
          authorization: 'Bearer test-jwt-token',
        },
      });

      await tasksHandler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(mockTasks);
      expect(mockPrismaTasks.task.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant-id' }, // From mocked req.user
        orderBy: { createdAt: 'desc' },
      });
    });
    
    it('should return 401 if user is not authenticated for GET', async () => {
      const { req, res } = createMocks({
        method: 'GET' as RequestMethod,
        // No authorization header
      });

      await tasksHandler(req as any, res as any);
      expect(res._getStatusCode()).toBe(401);
      expect(res._getJSONData().message).toBe('Authentication required.');
    });
  });
  
  it('should return 405 if method is not GET or POST', async () => {
    const { req, res } = createMocks({
      method: 'PUT' as RequestMethod, // Incorrect method
      headers: { authorization: 'Bearer test-jwt-token' },
    });

    await tasksHandler(req as any, res as any);
    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData().message).toBe('Method PUT Not Allowed');
  });
});
