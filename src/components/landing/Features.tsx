
import { Sparkles, Zap, GitBranch, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Specifications',
    description: 'Transform a single sentence into a comprehensive PRD with user stories, acceptance criteria, and technical notes.',
    color: 'indigo'
  },
  {
    icon: Zap,
    title: 'Instant Jira Sync',
    description: 'Push approved tickets directly to your Jira backlog with one click. No more manual copy-pasting.',
    color: 'blue'
  },
  {
    icon: GitBranch,
    title: 'Smart Workflows',
    description: 'Guided templates for Features, Bugs, and Technical Debt ensure you never miss a critical detail.',
    color: 'purple'
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to ship faster</h2>
          <p className="text-lg text-slate-600">WisePM handles the tedious parts of product management so you can focus on strategy and execution.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-${feature.color}-100 text-${feature.color}-600`}>
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
