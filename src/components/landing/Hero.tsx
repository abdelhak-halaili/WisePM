
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-100/30 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-8 animate-fade-in-up">
           <Sparkles size={14} className="text-indigo-600" />
           <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">AI-Powered Product Management</span>
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
          Stop Wasting Hours <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Writing Jira Tickets</span> from Scratch.
        </h1>
        
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Stop staring at blank pages. WisePM uses AI to generate comprehensive tickets, user stories, and acceptance criteria based on your rough ideas.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link 
            href="/login?mode=signup" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-xl shadow-slate-200"
          >
            Start Building for Free <ArrowRight size={20} />
          </Link>
          <Link 
            href="#features" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-lg font-semibold px-8 py-4 rounded-xl transition-all"
          >
            See How It Works
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500">
           <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> No credit card required</span>
           <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Free 5 AI generations/mo</span>
           <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Cancel anytime</span>
        </div>
      </div>
    </section>
  );
}
