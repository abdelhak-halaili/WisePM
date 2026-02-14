import { createClient } from '@/utils/supabase/server';
import { checkSubscription } from '@/lib/subscription';
import PricingClient from './PricingClient';

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isPro = user ? await checkSubscription(user.id) : false;

  return <PricingClient isPro={isPro} />;
}
