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
    },
  });

  // Create sample sale
  await prisma.sale.create({
    data: { tenantId: user.id, amount: 1234.56 },
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
          { role: 'user', content: 'Hello, BizAssist!' },
          { role: 'assistant', content: 'Welcome! How can I help today?' },
        ],
      },
    },
  });

  console.log('Seed completed:', { userId: user.id, saleId: conv.id });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });