import { vi } from 'vitest';

// Mock Prisma Client
// This provides a basic shell. Specific method mocks will be done in test files.
vi.mock('@/lib/db', async (importOriginal) => {
  const { PrismaClient } = await import('@prisma/client'); // Dynamically import to get the type
  const actualPrisma = await importOriginal<typeof import('@/lib/db')>(); // Get actual exports if needed for other things

  const mockPrisma = {
    // Mock specific models and their methods as needed globally, or do it per test suite
    // Example:
    // user: {
    //   findUnique: vi.fn(),
    //   create: vi.fn(),
    //   // ... other user methods
    // },
    // sale: {
    //   aggregate: vi.fn(),
    //   // ... other sale methods
    // },
    // task: {
    //   findMany: vi.fn(),
    //   create: vi.fn(),
    //   update: vi.fn(),
    //   delete: vi.fn(),
    //   // ... other task methods
    // },
    // Add other models as needed
    // $disconnect: vi.fn(), // If $disconnect is ever called in tested code
  };

  // If your @/lib/db exports `prisma` as default AND named, mock both.
  // Adjust based on how your actual @/lib/db.ts exports the prisma instance.
  // Current @/lib/db.ts does: export default prisma;
  return {
    ...actualPrisma, // Spread actual exports if there are other things exported from db.ts
    default: mockPrisma as unknown as PrismaClient, // Mock the default export
    prisma: mockPrisma as unknown as PrismaClient, // If it also exports a named 'prisma'
  };
});

// Global setup for environment variables, if any are critical for tests
// For example, if JWT_SECRET is needed widely and not set via other means for tests
// process.env.JWT_SECRET = 'test-secret-key'; // Use a consistent test secret

// Mock other global dependencies if necessary
// e.g., vi.mock('axios');

console.log('Vitest global setup: Prisma client mocked.');
