const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      password: passwordHash,
      role: 'USER',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      password: passwordHash,
      role: 'USER',
    },
  });

  const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  await prisma.task.createMany({
    data: [
      {
        title: 'Set up project repo',
        description: 'Initialize backend repo and CI config',
        status: 'DONE',
        dueDate: daysFromNow(-3),
        ownerId: alice.id,
      },
      {
        title: 'Design database schema',
        description: 'Model users and tasks in Prisma',
        status: 'DONE',
        dueDate: daysFromNow(-1),
        ownerId: alice.id,
      },
      {
        title: 'Implement auth endpoints',
        description: 'Register, login, refresh token flow',
        status: 'IN_PROGRESS',
        dueDate: daysFromNow(2),
        ownerId: alice.id,
      },
      {
        title: 'Write task CRUD API',
        description: null,
        status: 'PENDING',
        dueDate: daysFromNow(5),
        ownerId: bob.id,
      },
      {
        title: 'Add real-time notifications',
        description: 'Socket.io integration for task events',
        status: 'PENDING',
        dueDate: daysFromNow(7),
        ownerId: bob.id,
      },
      {
        title: 'Review pull requests',
        description: 'Admin review of team submissions',
        status: 'IN_PROGRESS',
        dueDate: daysFromNow(1),
        ownerId: admin.id,
      },
    ],
  });

  console.log('Seed complete:');
  console.log({ admin: admin.email, alice: alice.email, bob: bob.email });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
