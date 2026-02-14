const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkSubs() {
  try {
      const users = await prisma.userProfile.findMany({
        include: { subscription: true }
      });
      console.log(JSON.stringify(users, null, 2));
  } catch(e) {
      console.error(e);
  } finally {
      await prisma.$disconnect();
  }
}

checkSubs();
