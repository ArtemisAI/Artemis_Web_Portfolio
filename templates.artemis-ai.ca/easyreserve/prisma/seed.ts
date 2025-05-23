import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { name: 'The Artemis Bistro' },
    update: {},
    create: {
      name: 'The Artemis Bistro',
      tz: 'UTC',
      seatsTotal: 50,
    },
  });

  // Create sample customer
  const customer = await prisma.customer.upsert({
    where: { phone: '+15551234567' },
    update: {},
    create: {
      name: 'John Doe',
      phone: '+15551234567',
      email: 'john@example.com',
      dietaryPrefs: 'Vegetarian',
    },
  });

  // Create a reservation
  await prisma.reservation.create({
    data: {
      restaurantId: restaurant.id,
      customerId: customer.id,
      status: 'confirmed',
      partySize: 4,
      tsStart: new Date(Date.now() + 86400000),
      tsEnd: new Date(Date.now() + 90000000),
      specialRequest: 'Window seat',
    },
  });

  // Create a waitlist entry
  await prisma.waitlist.create({
    data: {
      restaurantId: restaurant.id,
      customerId: customer.id,
      desiredSlot: new Date(Date.now() + 172800000),
    },
  });

  console.log('EasyReserve seed completed');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });