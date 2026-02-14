const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const VARIANT_ID = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_MONTHLY;

async function activatePro() {
  try {
      // Get the first user
      const user = await prisma.userProfile.findFirst();
      if (!user) {
          console.log("No user found.");
          return;
      }

      console.log(`Activating Pro for user: ${user.email} (${user.id})`);

      // Upsert subscription
      const sub = await prisma.subscription.upsert({
          where: { userId: user.id },
          create: {
              userId: user.id,
              lemonSqueezyId: 'MANUAL_ACTIVATION_' + Date.now(),
              orderId: 'MANUAL_ORDER_' + Date.now(),
              status: 'active',
              variantId: VARIANT_ID || '1307803',
              renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
          },
          update: {
              status: 'active',
              variantId: VARIANT_ID || '1307803',
              renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }
      });

      console.log("Subscription activated:", sub);

  } catch(e) {
      console.error(e);
  } finally {
      await prisma.$disconnect();
  }
}

activatePro();
