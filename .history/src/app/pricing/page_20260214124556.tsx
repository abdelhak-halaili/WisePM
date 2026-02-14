'use client';

import { Check, Star } from 'lucide-react';
import CheckoutButton from '@/components/billing/CheckoutButton';
import { useEffect, useState } from 'react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const monthlyPrice = 12;
  const yearlyPrice = 120;
  const yearlyMonthlyEquivalent = 10;
  
  // These should match your .env IDs
  // We'll hardcode or pass via props/env for client side usage
  // Ideally use environment variables passed to client
  // For now, we assume the API route handles the lookup or we fetch them
  // But actually CheckoutButton expects an ID. 
  // Let's assume we pass the variant IDs via props or context in a real app
  // For this implementation, we need the IDs.
  // Since we can't expose secret IDs, but variant IDs are public enough.
  const monthlyVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_MONTHLY; 
  const yearlyVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_YEARLY; 
  
  // Note: We need to expose these in next.config.ts or prefix with NEXT_PUBLIC in .env
  // I will add a step to update .env to include NEXT_PUBLIC versions for frontend usage

  return (
    <div className="min-h-screen bg-gray-50/50 py-24">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 font-display">Upgrade to WisePM Pro</h1>
          <p className="text-xl text-gray-600 mb-8">Unlock unlimited AI power and advanced integrations.</p>
          
          {/* Toggle */}
          <div className="inline-flex bg-gray-100 p-1 rounded-full border border-gray-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Yearly <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">-17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Free</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-gray-600 mb-6 text-sm">Perfect for trying out the AI capabilities.</p>
            
            <button className="w-full py-2.5 px-4 rounded-lg border border-gray-300 font-medium text-gray-700 bg-gray-50 cursor-not-allowed mb-8">
              Current Plan
            </button>

            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span>5 AI Ticket Generations / month</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <Check className="w-5 h-5 text-green-500 shrink-0" />
                <span>Basic Project Management</span>
              </li>
               <li className="flex items-start gap-3 text-sm text-gray-400">
                <Check className="w-5 h-5 text-gray-300 shrink-0" />
                <span>Jira Integration</span>
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl p-8 border-2 border-primary shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              RECOMMENDED
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              Pro <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-gray-900">
                ${billingCycle === 'monthly' ? monthlyPrice : yearlyMonthlyEquivalent}
              </span>
              <span className="text-gray-500">/month</span>
            </div>
            {billingCycle === 'yearly' && (
                <p className="text-xs text-green-600 font-medium mb-6">Billed ${yearlyPrice} yearly</p>
            )}
            {!billingCycle || billingCycle === 'monthly' ? <div className="mb-6 h-4"></div> : null}
            
            <p className="text-gray-600 mb-6 text-sm">For power users who need unlimited access.</p>

            <CheckoutButton 
                variantId={billingCycle === 'monthly' ? "618585" : "618586"} 
                className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium mb-8 transition-colors shadow-md hover:shadow-lg flex justify-center"
            >
                Upgrade to Pro
            </CheckoutButton>

            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="font-medium">Unlimited AI Ticket Generations</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="font-medium">Jira Integration & Export</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Priority Support</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-700">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Early access to new features</span>
              </li>
            </ul>
          </div>
        </div>
        
        <p className="text-center text-gray-400 text-sm mt-12">
           Payments handled securely by Lemon Squeezy. You can cancel anytime.
        </p>
      </div>
    </div>
  );
}
