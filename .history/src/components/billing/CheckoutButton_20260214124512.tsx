'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface CheckoutButtonProps {
  variantId: string;
  className?: string;
  children?: React.ReactNode;
  email?: string; // Pre-fill email
  userId?: string; // Pass userId for webhook linking
}

export default function CheckoutButton({ variantId, className, children, email, userId }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    setLoading(true);
    try {
        // We will generate a checkout URL via our internal API to keep secrets safe
        // OR we can construct a simple URL if we don't need custom data signing yet
        // For simplicity v1, we can use the direct link with query params
        
        // Example: https://store.lemonsqueezy.com/checkout/buy/variant_id?checkout[email]=...
        
        // However, the best practice is to create a checkout session via API to pass custom data (userId)
        // Let's create an API route for this.
        
        const response = await axios.post('/api/billing/checkout', {
            variantId
        });
        
        const checkoutUrl = response.data.url;
        
        // Open Lemon Squeezy Overlay
        // @ts-ignore
        if (window.LemonSqueezy) {
             // @ts-ignore
            window.LemonSqueezy.Url.Open(checkoutUrl);
        } else {
            // Fallback
            window.location.href = checkoutUrl;
        }

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
