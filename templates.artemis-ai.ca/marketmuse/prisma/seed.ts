import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default user
  const user = await prisma.user.upsert({
    where: { email: 'user@marketmuse.ai' },
    update: {},
    create: { email: 'user@marketmuse.ai', name: 'Alice Smith' },
  });

  // Create a template
  await prisma.template.create({
    data: {
      ownerId: user.id,
      name: 'Blog Post',
      channel: 'blog',
      json: { title: '', body: '', channel: 'blog' },
    },
  });

  // Create a draft content
  const content = await prisma.content.create({
    data: {
      ownerId: user.id,
      title: 'My First Post',
      body: 'Hello world! This is a sample post.',
      channel: 'blog',
    },
  });

  // Schedule the content for tomorrow
  await prisma.schedule.create({
    data: {
      contentId: content.id,
      jobId: 'n8n-blog-publish',
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  console.log('MarketMuse seed completed');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });