import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Scigestible',
  description: 'Terms of Service for Scigestible — AI-powered research paper analysis.',
};

const LAST_UPDATED = '19 June 2026';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300">
      <div className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        <Link
          href="/"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Scigestible
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account or using Scigestible (&ldquo;the Service&rdquo;, &ldquo;we&rdquo;,
              &ldquo;us&rdquo;), you agree to these Terms of Service. If you do not agree, do not use
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              2. Description of Service
            </h2>
            <p>
              Scigestible is an AI-powered tool that helps you read, summarise, and understand
              research papers. You can upload PDFs, search for papers online, organise them into
              folders, and ask questions about their content. Core features are available free of
              charge; additional capacity is available via a paid Pro subscription.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              3. User Accounts
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                You must provide a valid email address to register. You are responsible for keeping
                your account credentials secure.
              </li>
              <li>
                You must be at least 13 years old to use the Service. If you are under 18, you
                must have parental consent.
              </li>
              <li>
                You may not share your account with others or create accounts on behalf of third
                parties without their permission.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              4. Subscriptions and Payments
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                The <strong>Free plan</strong> allows up to 10 stored papers, 5 uploads per day,
                and 3 AI questions per day.
              </li>
              <li>
                The <strong>Pro plan</strong> (£5/month) provides unlimited paper storage, up to
                50 uploads per day, and up to 50 AI questions per day, with no advertising.
              </li>
              <li>
                Payments are processed by <strong>Stripe</strong>. By subscribing you authorise
                recurring billing at the stated price until you cancel.
              </li>
              <li>
                You may cancel at any time via the billing portal in your account settings. Access
                continues until the end of the current billing period; we do not offer partial
                refunds.
              </li>
              <li>
                We reserve the right to change pricing with 30 days&apos; notice. Continued use
                after the change takes effect constitutes acceptance.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              5. Acceptable Use
            </h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Upload content you do not have the right to use or share.</li>
              <li>Attempt to reverse-engineer, scrape, or abuse the Service or its APIs.</li>
              <li>Use the Service to generate content that is unlawful, harmful, or deceptive.</li>
              <li>Circumvent plan limits through technical means (e.g. multiple accounts).</li>
              <li>Interfere with the security or integrity of the Service.</li>
            </ul>
            <p className="mt-3">
              We may suspend or terminate accounts that violate these rules without notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              6. Your Content
            </h2>
            <p>
              You retain ownership of the PDFs and other content you upload. By uploading content
              you grant us a limited licence to store, process, and display it solely for the
              purpose of providing the Service to you. We do not sell or share your content with
              third parties, except as required to operate the Service (e.g. sending text to
              OpenAI for summarisation).
            </p>
            <p className="mt-2">
              You are responsible for ensuring you have the right to upload any document. Do not
              upload content that infringes third-party copyright.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              7. AI-Generated Content
            </h2>
            <p>
              Summaries, answers, and other AI-generated outputs are produced automatically and
              may contain errors or omissions. They are provided for informational purposes only
              and should not be relied upon as professional, medical, legal, or academic advice.
              Always verify important information against the original source.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              8. Intellectual Property
            </h2>
            <p>
              The Scigestible name, logo, interface, and underlying software are our property.
              Nothing in these Terms grants you a right to use our trademarks or copy our software.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              9. Disclaimers
            </h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
              warranties of any kind, express or implied. We do not guarantee uptime, accuracy of
              AI outputs, or that the Service will meet your specific requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              10. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, Scigestible shall not be liable for any
              indirect, incidental, or consequential damages arising from your use of the Service.
              Our total liability to you for any claim shall not exceed the amount you paid us in
              the 12 months preceding the claim, or £10, whichever is greater.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              11. Termination
            </h2>
            <p>
              You may delete your account at any time from the settings menu in the app. We may
              terminate or suspend your access if you breach these Terms. Upon account deletion,
              your stored papers and associated data are removed from our systems.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              12. Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. Material changes will be communicated
              by updating the &ldquo;Last updated&rdquo; date and, where appropriate, by email.
              Continued use of the Service after changes are posted constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              13. Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of England and Wales. Any disputes shall be
              subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              14. Contact
            </h2>
            <p>
              Questions about these Terms? Email us at{' '}
              <a
                href="mailto:daniel.s.murphy@outlook.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                daniel.s.murphy@outlook.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
