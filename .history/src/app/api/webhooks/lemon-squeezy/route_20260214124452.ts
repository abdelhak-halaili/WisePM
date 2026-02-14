import { NextRequest, NextResponse } from 'next/server';
import { verifySignature } from '@/lib/lemon-squeezy';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Verify signature
  const signature = request.headers.get('x-signature');
  const body = await request.text();
  
  // Note: We need the raw body for signature verification
  // But verifySignature helper expects Request object which is stream
  // We'll reimplement verification here with raw body string
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  const digest = Buffer.from(hmac.update(body).digest('hex'), 'utf8');
  const signatureBuffer = Buffer.from(signature || '', 'utf8');
  
  if (!signature || !crypto.timingSafeEqual(digest, signatureBuffer)) {
     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const eventName = payload.meta.event_name;
  const data = payload.data;
  const attributes = data.attributes;
  
  // We expect user_email to link to our user
  // Or better, we can pass userId in "custom_data" during checkout
  const email = attributes.user_email;
  
  console.log(`Received Lemon Squeezy webhook: ${eventName} for ${email}`);

  try {
      const user = await prisma.userProfile.findFirst({
          where: { email: email }
      });
      
      if (!user) {
          console.warn(`User not found for email: ${email}`);
          // Return 200 to acknowledge webhook even if user missing
          return NextResponse.json({ received: true }); 
      }

      const subscriptionData = {
          lemonSqueezyId: data.id,
          orderId: String(attributes.order_id),
          variantId: String(attributes.variant_id),
          status: attributes.status,
          renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
          endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
      };

      if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
          await prisma.subscription.upsert({
              where: { userId: user.id },
              update: subscriptionData,
              create: {
                  userId: user.id,
                  ...subscriptionData
              }
          });
      } 
      else if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
          // Keep the record but update status/endsAt
          await prisma.subscription.update({
              where: { userId: user.id },
              data: {
                  status: attributes.status,
                  endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
                  renewsAt: null
              }
          });
      }

      return NextResponse.json({ received: true });

  } catch (error) {
      console.error('Webhook processing error:', error);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
