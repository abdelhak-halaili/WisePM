import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'; // Or however we get auth
import { createClient } from '@/utils/supabase/server'; // Or prisma

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variantId } = body;
    
    // Auth Check (Assuming Supabase or Clerk)
    // For now, let's assume we can get user info via headers or session
    // Since we are using Supabase Auth in other parts:
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;

    // Create Checkout Session
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                user_id: user.id // Pass this to match in webhook!
              }
            },
            product_options: {
                redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin')}/dashboard?success=true`,
            }
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: storeId?.toString()
              }
            },
            variant: {
              data: {
                type: "variants",
                id: variantId.toString()
              }
            }
          }
        }
      })
    });

    const session = await response.json();
    
    if (session.errors) {
        console.error('Lemon API Error:', session.errors);
        return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
    }

    return NextResponse.json({ url: session.data.attributes.url });

  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
