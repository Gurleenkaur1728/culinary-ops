import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@culinaryops.com' },
    update: {},
    create: {
      email: 'admin@culinaryops.com',
      password: hashedPassword,
      name: 'Admin',
    },
  });
  console.log('Created admin user:', admin.email);

  console.log('Database seeded. Login: admin@culinaryops.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
