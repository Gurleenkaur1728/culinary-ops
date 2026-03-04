import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin user...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@betterday.com' },
    update: {},
    create: {
      email: 'admin@betterday.com',
      password_hash: hashedPassword,
      role: 'admin',
    },
  });

  console.log('✅ Admin user ready:', admin.email);
  console.log('   Password: admin123');

  const counts = await Promise.all([
    prisma.ingredient.count(),
    prisma.subRecipe.count(),
    prisma.mealRecipe.count(),
  ]);
  console.log(`\n📊 Database state:`);
  console.log(`   Ingredients : ${counts[0]}`);
  console.log(`   Sub-Recipes : ${counts[1]}`);
  console.log(`   Meals       : ${counts[2]}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
