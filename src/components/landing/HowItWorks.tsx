
import { Pencil, Lightbulb, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    icon: Lightbulb,
    title: '1. Describe your idea',
    description: 'Input a rough title and description. "Add a dark mode to the settings page" is enough to start.'
  },
  {
    icon: Pencil,
    title: '2. AI Refines It',
    description: 'WisePM generates a full specification, breaking it down into user stories, acceptance criteria, and edge cases.'
  },
  {
    icon: CheckCircle2,
    title: '3. Sync & Ship',
    description: 'Review the generated ticket, make tweaks if needed, and push it directly to Jira or your dev team.'
  }
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-indigo-600 font-semibold tracking-wide uppercase text-sm">Workflow</span>
          <h2 className="text-3xl font-bold text-slate-900 mt-2 mb-4">From Idea to Jira in Minutes</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10" />
          
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              <div className="w-24 h-24 bg-white rounded-full border-2 border-indigo-100 flex items-center justify-center mx-auto mb-6 shadow-sm z-10">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                  <step.icon size={32} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
