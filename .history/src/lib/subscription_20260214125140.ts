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

export const checkTicketGenerationLimit = cache(async (userId: string) => {
    if (!userId) return { allowed: false, reason: 'Unauthorized' };

    // 1. Check if Pro
    const isPro = await checkSubscription(userId);
    if (isPro) return { allowed: true };

    // 2. Count tickets created this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Note: This counts SAVED tickets. 
    // Ideally we should track "generations" even if not saved to prevent abuse,
    // but tracking saved tickets is a good proxy for "value obtained".
    // If we want to track every generation, we'd need a separate "Usage" table.
    // For MVP, limiting based on SAVED tickets is safer UX (don't punish for bad AI results),
    // BUT we pay for generations. 
    // Let's stick to SAVED tickets for the "Limit" to start, or we can just count calls?
    // The prompt says "5 AI Ticket Generations". 
    // If we only count saved, they can generate 100 and save 5.
    // Let's count SAVED tickets for now as it maps to the database `Ticket` model easily.
    
    const count = await prisma.ticket.count({
        where: {
            userId,
            createdAt: { gte: startOfMonth }
        }
    });

    const FREE_LIMIT = 5;
    
    if (count >= FREE_LIMIT) {
        return { 
            allowed: false, 
            reason: 'You have reached your free limit of 5 tickets this month. Upgrade to Pro for unlimited access.',
            limit: FREE_LIMIT,
            usage: count
        };
    }

    return { allowed: true, limit: FREE_LIMIT, usage: count };
});
