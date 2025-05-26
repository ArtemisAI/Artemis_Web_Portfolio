import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a default user
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Jane Doe',
      role: 'admin',
      tenant_id: 'tenant_placeholder_123', // Added
      password_hash: 'hash_placeholder_xyz', // Added
    },
  });

  // Create sample sale
  await prisma.sale.create({
    data: { 
      tenantId: user.tenant_id, // Using tenant_id from user
      amount: 1234.56,
      product_id: 'product_placeholder_abc', // Added
      channel: 'online', // Added
    },
  });

  // Create sample task
  await prisma.task.create({
    data: { tenantId: user.id, title: 'Follow up email', dueAt: new Date(Date.now() + 86400000) },
  });

  // Create a conversation and a message
  const conv = await prisma.conversation.create({
    data: {
      tenantId: user.id,
      userId: user.id,
      messages: {
        create: [
          { role: 'user', content: 'Hello, BizAssist!', tokens: 5 }, // Added tokens
          { role: 'assistant', content: 'Welcome! How can I help today?', tokens: 8 }, // Added tokens
        ],
      },
    },
  });

  console.log('Seed completed:', { userId: user.id, conversationId: conv.id }); // Corrected log key
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });