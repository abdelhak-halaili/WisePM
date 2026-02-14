const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSubs() {
  const users = await prisma.userProfile.findMany({
    include: { subscription: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

checkSubs()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
