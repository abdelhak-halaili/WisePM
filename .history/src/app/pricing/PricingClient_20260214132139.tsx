'use client';

import { Check, Star, Zap, Shield, Sparkles } from 'lucide-react';
import CheckoutButton from '@/components/billing/CheckoutButton';
import { useState } from 'react';
import Link from 'next/link';

interface PricingClientProps {
  isPro: boolean;
}

export default function PricingClient({ isPro }: PricingClientProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const monthlyPrice = 12;
  const yearlyPrice = 120;
  const yearlyMonthlyEquivalent = 10;
  
  const monthlyVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_MONTHLY || "1307803"; 
  const yearlyVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_YEARLY || "1307783"; 

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Hero Section */}
      <div className="bg-[#0F172A] text-white pt-24 pb-32 px-4 relative overflow-hidden">
        {/* ... (same hero content) ... */}
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl opacity-50 Mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl opacity-30"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Supercharge your workflow</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-200 pb-2">
            Pricing that scales with your ambition
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop manually managing tickets. Unlock AI-powered automation and let WisePM handle the busy work while you build great products.
          </p>
          
          {/* Toggle */}
          <div className="inline-flex bg-slate-800/50 p-1.5 rounded-full border border-slate-700/50 backdrop-blur-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                billingCycle === 'monthly' 
                  ? 'bg-white text-slate-900 shadow-lg shadow-indigo-500/20 scale-[1.02]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                billingCycle === 'yearly' 
                  ? 'bg-white text-slate-900 shadow-lg shadow-indigo-500/20 scale-[1.02]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Yearly <span className="text-[10px] uppercase tracking-wider bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-500/30">Save 17%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-20 pb-24">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Free Plan */}
          <div className="group bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-indigo-100 transition-all duration-300 hover:-translate-y-1 relative">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-black text-slate-900 tracking-tight">$0</span>
            </div>
            <p className="text-slate-500 mb-8 font-medium">Perfect for hobbyists and side projects to get a taste of AI.</p>
            
            {/* Dynamic Button for Free Plan */}
            {!isPro ? (
                 <button className="w-full py-4 px-6 rounded-xl border-2 border-slate-100 font-bold text-slate-400 bg-slate-50 cursor-not-allowed mb-8 text-sm uppercase tracking-wide">
                    Current Plan
                </button>
            ) : (
                <button className="w-full py-4 px-6 rounded-xl border-2 border-slate-900 font-bold text-slate-900 bg-white hover:bg-slate-50 mb-8 text-sm uppercase tracking-wide">
                    Downgrade
                </button>
            )}

            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <span className="text-slate-700 font-medium">5 AI Ticket Generations <span className="text-slate-400 font-normal">/ month</span></span>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <span className="text-slate-700 font-medium">Basic Project Management</span>
              </li>
               <li className="flex items-start gap-4 opacity-50 grayscale">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <span className="text-slate-500">Jira Integration (Locked)</span>
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="group bg-slate-900 rounded-3xl p-1 relative shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300">
            {/* Radiant Border */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 rounded-3xl opacity-100"></div>
            
            <div className="bg-[#0B1121] rounded-[22px] p-8 h-full relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="absolute top-6 right-6">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-indigo-500/20 uppercase tracking-wider">
                    Most Popular
                    </span>
                </div>
            
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-white">Pro</h3>
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                </div>
                
                <div className="flex items-baseline gap-1 mb-1">
                <span className="text-5xl font-black text-white tracking-tight">
                    ${billingCycle === 'monthly' ? monthlyPrice : yearlyMonthlyEquivalent}
                </span>
                <span className="text-slate-400 font-medium">/month</span>
                </div>
                
                <div className="h-6 mb-6">
                    {billingCycle === 'yearly' ? (
                        <p className="text-sm text-green-400 font-semibold flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-current" /> Billed ${yearlyPrice} yearly
                        </p>
                    ) : (
                        <p className="text-sm text-slate-500">Cancel anytime.</p>
                    )}
                </div>
                
                <p className="text-indigo-100/80 mb-8 font-medium">For serious product managers who need unlimited power.</p>

                {/* Dynamic Button for Pro Plan */}
                 {isPro ? (
                    <button className="w-full py-4 px-6 rounded-xl bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-bold mb-8 cursor-default flex justify-center items-center gap-2">
                        <Check className="w-5 h-5" /> Current Plan
                    </button>
                 ) : (
                    <CheckoutButton 
                        variantId={billingCycle === 'monthly' ? monthlyVariantId : yearlyVariantId} 
                        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold mb-8 transition-all shadow-lg shadow-indigo-500/25 flex justify-center group-hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Upgrade to Pro
                    </CheckoutButton>
                 )}

                <ul className="space-y-5">
                <li className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-white font-medium">Unlimited AI Ticket Generations</span>
                </li>
                <li className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-white font-medium">Jira Integration & Export</span>
                </li>
                <li className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-white font-medium">Priority 24/7 Support</span>
                </li>
                <li className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-white font-medium">Early access to beta features</span>
                </li>
                </ul>
            </div>
          </div>
        </div>
        
        {/* Social Proof / Trust */}
        <div className="mt-20 text-center border-t border-slate-200 pt-16">
           <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Trusted Protection</p>
           <div className="flex justify-center items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex items-center gap-2 text-slate-500">
                    <Shield className="w-5 h-5" />
                    <span className="font-semibold">Secure Payment Processing by Lemon Squeezy</span>
                </div>
           </div>
        </div>
      </div>
    </div>
  );
}
