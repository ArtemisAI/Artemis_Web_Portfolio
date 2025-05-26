import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleChatPrompt, McpResponse } from './mcpService'; // Adjust path if needed
import prisma from '@/lib/db'; // Will be mocked by vitest.setup.ts
import axios from 'axios';
import { Ollama } from 'ollama'; // Actual Ollama class
import type { JwtPayload } from '@/lib/authMiddleware';

// Mock external dependencies
vi.mock('axios');
vi.mock('ollama', () => {
  // Mock the Ollama class and its methods
  const mockOllamaGenerate = vi.fn();
  const MockOllama = vi.fn(() => ({
    generate: mockOllamaGenerate,
  }));
  return { Ollama: MockOllama, mockOllamaGenerate }; // Export mockOllamaGenerate for easy access in tests
});

// Mock prisma client methods more specifically for these tests
// Note: vitest.setup.ts provides a general mock. Here we can refine.
const mockPrisma = {
  sale: {
    aggregate: vi.fn(),
  },
  task: {
    findMany: vi.fn(),
  },
  // Add other models and methods if mcpService expands
};

vi.mock('@/lib/db', () => ({
  default: mockPrisma,
  prisma: mockPrisma, // if you also use named export
}));


describe('mcpService - handleChatPrompt', () => {
  const mockUser: JwtPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    tenant_id: 'test-tenant-id',
    role: 'user',
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    // Reset specific mock implementations if needed
    mockPrisma.sale.aggregate.mockReset();
    mockPrisma.task.findMany.mockReset();
    // Access the mockGenerate function from the mocked 'ollama' module
    const { mockOllamaGenerate } = require('ollama');
    mockOllamaGenerate.mockReset();

  });

  // Sales Intent Test
  it('should handle "sales" prompt and return sales data', async () => {
    mockPrisma.sale.aggregate.mockResolvedValue({
      _sum: { amount: 5000 },
      _count: { id: 10 },
    });

    const response = await handleChatPrompt('show me my sales', mockUser);
    
    expect(mockPrisma.sale.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: mockUser.tenant_id,
          date: expect.any(Object), // Further date checks could be added
        },
      })
    );
    expect(response.reply).toContain('your total sales are $5,000.00 from 10 transactions');
    expect(response.stream).toBeUndefined();
  });

  it('should handle "sales" prompt with no sales data', async () => {
    mockPrisma.sale.aggregate.mockResolvedValue({
      _sum: { amount: 0 },
      _count: { id: 0 },
    });
    const response = await handleChatPrompt('any sales this month?', mockUser);
    expect(response.reply).toEqual('There are no sales recorded for the current month.');
  });

  // Tasks Intent Test
  it('should handle "tasks" prompt and return pending tasks', async () => {
    const mockTasks = [
      { title: 'Task 1', dueAt: new Date('2024-01-15T00:00:00.000Z') },
      { title: 'Task 2', dueAt: new Date('2024-01-16T00:00:00.000Z') },
    ];
    mockPrisma.task.findMany.mockResolvedValue(mockTasks);

    const response = await handleChatPrompt('what are my tasks', mockUser);

    expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: mockUser.tenant_id, completed: false },
        orderBy: { dueAt: 'asc' },
        take: 5,
      })
    );
    expect(response.reply).toContain('You have 2 pending task(s).');
    expect(response.reply).toContain("'Task 1' due on 1/15/2024"); // Date format might vary by locale
    expect(response.reply).toContain("'Task 2' due on 1/16/2024");
  });

  it('should handle "tasks" prompt with no pending tasks', async () => {
    mockPrisma.task.findMany.mockResolvedValue([]);
    const response = await handleChatPrompt('any tasks pending?', mockUser);
    expect(response.reply).toEqual("You have no pending tasks. Great job!");
  });

  // Reminder Intent Test
  it('should handle "/remind" command and call n8n webhook', async () => {
    const mockAxiosPost = vi.mocked(axios.post).mockResolvedValue({
      status: 200,
      data: { message: 'Reminder set via n8n!' },
    });
    process.env.N8N_REMINDER_WEBHOOK_URL = 'http://fake-n8n-webhook.com/reminder';

    const response = await handleChatPrompt('/remind "Buy milk" on tomorrow 10am', mockUser);

    expect(mockAxiosPost).toHaveBeenCalledWith(
      'http://fake-n8n-webhook.com/reminder',
      {
        userId: mockUser.userId,
        tenantId: mockUser.tenant_id,
        reminderText: 'Buy milk',
        dateTimeString: 'tomorrow 10am',
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    expect(response.reply).toEqual('Reminder set via n8n!');
  });
  
  it('should handle invalid "/remind" syntax', async () => {
    const response = await handleChatPrompt('/remind buy milk', mockUser); // Missing quotes and "on"
    expect(response.reply).toContain('To set a reminder, please use the format:');
  });

  it('should inform if N8N_REMINDER_WEBHOOK_URL is not set for /remind', async () => {
    delete process.env.N8N_REMINDER_WEBHOOK_URL; // Ensure it's undefined for this test
    const response = await handleChatPrompt('/remind "Test" on tomorrow', mockUser);
    expect(response.reply).toEqual("Sorry, the reminder service is not configured correctly.");
  });


  // Ollama Fallback Test
  it('should delegate to Ollama for generic prompts and return a stream', async () => {
    const { mockOllamaGenerate } = require('ollama'); // Get the specific mock function
    const mockStream = (async function* () {
      yield { response: 'Hello ' };
      yield { response: 'from ' };
      yield { response: 'Ollama!' };
    })();
    mockOllamaGenerate.mockResolvedValue(mockStream);
    process.env.OLLAMA_URL = 'http://mock-ollama-host.com';


    const response = await handleChatPrompt('Tell me a joke', mockUser);

    expect(mockOllamaGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'llama3',
        prompt: expect.stringContaining('User: Tell me a joke\nAssistant:'),
        stream: true,
      })
    );
    expect(response.stream).toBeDefined();
    if (response.stream) {
      const chunks = [];
      for await (const chunk of response.stream) {
        chunks.push(chunk.response);
      }
      expect(chunks.join('')).toEqual('Hello from Ollama!');
    }
  });

  it('should handle Ollama connection error', async () => {
    const { mockOllamaGenerate } = require('ollama');
     mockOllamaGenerate.mockRejectedValue({ cause: { code: 'ECONNREFUSED' } });
    process.env.OLLAMA_URL = 'http://mock-ollama-host.com';


    const response = await handleChatPrompt('Generic query', mockUser);
    expect(response.error).toEqual("The AI service (Ollama) is currently unavailable. Please try again later.");
    expect(response.reply).toBeUndefined();
    expect(response.stream).toBeUndefined();
  });

  // Error Handling for Prisma
  it('should handle Prisma error during sales intent', async () => {
    mockPrisma.sale.aggregate.mockRejectedValue(new Error('Prisma sales query failed'));
    const response = await handleChatPrompt('show sales', mockUser);
    expect(response.reply).toEqual("I encountered an error while trying to fetch your sales data.");
  });

  it('should handle Prisma error during tasks intent', async () => {
    mockPrisma.task.findMany.mockRejectedValue(new Error('Prisma tasks query failed'));
    const response = await handleChatPrompt('list tasks', mockUser);
    expect(response.reply).toEqual("I encountered an error while trying to fetch your task data.");
  });

  afterEach(() => {
    // Restore any environment variables changed during tests
    // (Not strictly necessary here as new process for each run, but good practice)
  });
});
