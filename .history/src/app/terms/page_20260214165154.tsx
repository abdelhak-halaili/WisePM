import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 transition-colors">
          <ArrowLeft size={20} />
          Back to Home
        </Link>
        
        <h1 className="text-4xl font-extrabold mb-8 tracking-tight">Terms of Service</h1>
        <p className="text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using WisePM, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <p className="leading-relaxed">
              WisePM provides AI-powered project management tools. We reserve the right to modify, suspend, or discontinue the service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
            <p className="leading-relaxed">
              You are responsible for maintaining the security of your account and password. WisePM cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Payment and Refunds</h2>
            <p className="leading-relaxed">
              Payments are processed securely via Paddle.com. Refunds are handled on a case-by-case basis. You can cancel your subscription at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Limitation of Liability</h2>
            <p className="leading-relaxed">
              In no event shall WisePM be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section className="bg-slate-100 p-6 rounded-xl border border-slate-200">
            <h2 className="text-lg font-bold mb-2">Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at <a href="mailto:support@wisepm.com" className="text-indigo-600 hover:underline">support@wisepm.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
