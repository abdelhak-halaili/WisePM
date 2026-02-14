import { createClient } from '@/utils/supabase/server';
import { checkSubscription } from '@/lib/subscription';
import PricingClient from './PricingClient';

import Sidebar from '@/components/Sidebar';

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isPro = user ? await checkSubscription(user.id) : false;

  if (user) {
      return (
          <div className="flex min-h-screen bg-slate-50">
              <Sidebar isPro={isPro} />
              <main className="flex-1 ml-[260px]">
                  <PricingClient isPro={isPro} />
              </main>
          </div>
      );
  }

  return <PricingClient isPro={isPro} />;
}
