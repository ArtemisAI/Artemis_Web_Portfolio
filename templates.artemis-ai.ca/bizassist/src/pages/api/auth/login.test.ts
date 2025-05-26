import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http'; // Or any other way to mock req/res
import loginHandler from './login'; // Adjust path to your login handler
import prisma from '@/lib/db'; // Mocked via vitest.setup.ts or specific mocks here
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');
// Prisma is globally mocked or can be specifically mocked here if needed
// For instance, if the global mock is too generic:
const mockPrismaLogin = {
  user: {
    findUnique: vi.fn(),
  },
};
vi.mock('@/lib/db', () => ({
  default: mockPrismaLogin,
  prisma: mockPrismaLogin,
}));


describe('/api/auth/login', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...OLD_ENV }; // Make a copy
    process.env.JWT_SECRET = 'test-secret-for-login'; // Set for these tests
  });

  afterEach(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it('should successfully log in a user with correct credentials', async () => {
    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      tenant_id: 'tenant1',
      role: 'user',
      name: 'Test User',
    };
    mockPrismaLogin.user.findUnique.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never); // Cast to never if type issues
    vi.mocked(jwt.sign).mockReturnValue('mocked.jwt.token');

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    await loginHandler(req as any, res as any); // Cast if types don't match perfectly

    expect(res._getStatusCode()).toBe(200);
    const jsonResponse = res._getJSONData();
    expect(jsonResponse.message).toBe('Login successful');
    expect(jsonResponse.token).toBe('mocked.jwt.token');
    expect(jsonResponse.user.email).toBe(mockUser.email);
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        userId: mockUser.id,
        email: mockUser.email,
        tenant_id: mockUser.tenant_id,
        role: mockUser.role,
      },
      'test-secret-for-login',
      { expiresIn: '1h' }
    );
  });

  it('should return 401 for incorrect password', async () => {
    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      tenant_id: 'tenant1',
      role: 'user',
    };
    mockPrismaLogin.user.findUnique.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    });

    await loginHandler(req as any, res as any);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData().message).toBe('Invalid credentials');
  });

  it('should return 401 if user is not found', async () => {
    mockPrismaLogin.user.findUnique.mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'nonexistent@example.com',
        password: 'password123',
      },
    });

    await loginHandler(req as any, res as any);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData().message).toBe('Invalid credentials');
  });

  it('should return 400 for missing email or password', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com', // Password missing
      },
    });

    await loginHandler(req as any, res as any);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData().message).toBe('Password is required');
  });
  
  it('should return 405 if method is not POST', async () => {
    const { req, res } = createMocks({
      method: 'GET', // Incorrect method
    });

    await loginHandler(req as any, res as any);
    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData().message).toBe('Method GET Not Allowed');
  });
});
