export function initializePaddle(token: string) {
  if (typeof window !== 'undefined' && !window.Paddle) {
       // Paddle script is usually loaded via CDN in layout or automatically by the @paddle/paddle-js package if imported
       // But for Next.js, we often use the package.
  }
}

// We will use the @paddle/paddle-js package directly in the component.
// This file can hold helper types or constants.

export const PADDLE_PRICES = {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_MONTHLY || '',
    yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_YEARLY || '',
};
