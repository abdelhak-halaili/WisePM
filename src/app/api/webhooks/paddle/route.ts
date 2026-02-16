import { NextRequest, NextResponse } from 'next/server';
import { Paddle, EventName } from '@paddle/paddle-node-sdk';
import prisma from '@/lib/prisma';

const paddle = new Paddle(process.env.PADDLE_API_KEY || '');

export async function POST(req: NextRequest) {
    const signature = req.headers.get('paddle-signature');
    if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Get raw body for verification
    const bodyText = await req.text();
    const secret = process.env.PADDLE_WEBHOOK_SECRET || '';

    if (!secret) {
        console.error('PADDLE_WEBHOOK_SECRET is not set');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        if (!paddle.webhooks.unmarshal(bodyText, secret, signature)) {
             return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
    } catch (e) {
        console.error('Webhook verification failed:', e);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    try {
        // Parse JSON after verification (safe)
        const body = JSON.parse(bodyText);
        const eventType = body.event_type;
        const data = body.data;

        console.log(`Paddle Webhook: ${eventType}`, data.id);

        if (eventType === 'subscription.created' || eventType === 'subscription.updated') {
            const status = data.status; // 'active', 'paused', etc.
            const customerId = data.customer_id;
            const priceId = data.items[0].price.id;
            const customData = data.custom_data; // This is where we passed userId!
            
            let userId = customData?.userId;

            if (userId) {
                 await prisma.subscription.upsert({
                    where: { userId: userId },
                    create: {
                        userId: userId,
                        paddleSubscriptionId: data.id,
                        paddlePriceId: priceId,
                        paddleCustomerId: customerId,
                        status: status,
                        renewsAt: new Date(data.next_billed_at),
                        endsAt: null
                    },
                    update: {
                        status: status,
                        paddlePriceId: priceId,
                        renewsAt: new Date(data.next_billed_at)
                    }
                });
                console.log(`Updated subscription for user ${userId}`);
            }
        }
        
        else if (eventType === 'transaction.completed') {
             // Often better for initial creation
             const customData = data.custom_data;
             const userId = customData?.userId;
             
             if (userId) {
                 // Check if subscription exists, if not create placeholder
                 // Ideally subscription.created fires too.
             }
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Paddle Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
    }
}
