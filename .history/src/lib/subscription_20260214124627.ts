import prisma from '@/lib/prisma';
import { cache } from 'react';

// Use React cache to dedup requests in RSC
export const checkSubscription = cache(async (userId: string) => {
  if (!userId) return false;
  
  try {
      const subscription = await prisma.subscription.findUnique({
          where: { userId: userId },
          select: { status: true, endsAt: true }
      });

      if (!subscription) return false;

      const isValidStatus = 
          subscription.status === 'active' || 
          subscription.status === 'on_trial';
      
      // If status is cancelled, check if period is still active
      if (subscription.status === 'cancelled') {
             if (subscription.endsAt && new Date(subscription.endsAt) > new Date()) {
                 return true;
             }
      }

      return isValidStatus;

  } catch (error) {
      console.error('Subscription check error:', error);
      return false;
  }
});
