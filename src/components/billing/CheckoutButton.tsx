'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

// Initialize Paddle once
let paddle: Paddle | undefined;

interface CheckoutButtonProps {
  variantId: string; // This will now be the Paddle Price ID
  className?: string;
  children: React.ReactNode;
  email?: string; 
  userId?: string; 
}

export default function CheckoutButton({ variantId, className, children, email, userId }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializePaddle({ 
        environment: 'sandbox', 
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_token' 
    }).then((paddleInstance: Paddle | undefined) => {
        if (paddleInstance) {
            paddle = paddleInstance;
        }
    });
  }, []);

  const handleCheckout = async () => {
    if (!paddle) {
        console.error('Paddle not initialized');
        return;
    }

    setLoading(true);
    try {
        paddle.Checkout.open({
            items: [{ priceId: variantId, quantity: 1 }],
            customer: {
                email: email || '',
            },
            customData: {
                userId: userId || ''
            },
            settings: {
                displayMode: 'overlay',
                theme: 'light',
                locale: 'en'
            }
        });
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Failed to start checkout');
    } finally {
        setLoading(false);
    }
  };

  return (
    <button onClick={handleCheckout} className={className} disabled={loading}>
      {loading ? <Loader2 className="animate-spin w-4 h-4" /> : children}
    </button>
  );
}
