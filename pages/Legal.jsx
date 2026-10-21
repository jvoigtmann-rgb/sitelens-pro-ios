import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, FileText, ArrowRight } from "lucide-react";

export default function Legal({ initialTab = "privacy" }) {
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal public header — no app nav requiring login */}
      <header className="border-b border-border bg-card safe-top">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">
              <span className="text-foreground">Site</span>
              <span className="text-[#2dd4bf]">Lens</span>
            </span>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Go to app
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex gap-1">
          <TabButton active={tab === "privacy"} onClick={() => setTab("privacy")} icon={Shield} label="Privacy Policy" />
          <TabButton active={tab === "terms"} onClick={() => setTab("terms")} icon={FileText} label="Terms of Use" />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {tab === "privacy" ? <PrivacyPolicy /> : <TermsOfUse />}

        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            Questions about this policy? Contact the app owner from within SiteLens.
          </p>
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-[#2dd4bf] text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPolicy() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 8, 2026</p>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        This Privacy Policy describes how SiteLens ("we," "us," or "the app") collects, uses, and
        protects information when you use the application. By using SiteLens, you agree to the
        practices described here.
      </p>

      <Section title="Information We Collect">
        <p>
          <strong className="text-foreground">Account information:</strong> Your name and email
          address, provided when you are invited to and register for the app, used to authenticate
          you and attribute inspection reports to your account.
        </p>
        <p>
          <strong className="text-foreground">Inspection content:</strong> Property details, photos,
          and notes you upload, along with AI-generated analysis and issue assessments derived from
          those photos. Reports you create are visible to you and, if applicable, to administrators
          of your organization.
        </p>
        <p>
          <strong className="text-foreground">Location data:</strong> When you upload photos, we may
          extract GPS coordinates from image metadata to place photos on a map within your report.
          This is optional and only used when the data is present in the image.
        </p>
        <p>
          <strong className="text-foreground">Usage data:</strong> Basic analytics events (e.g., report
          created) to help us improve the product. We do not collect personal browsing data or sell
          any information to third parties.
        </p>
      </Section>

      <Section title="How We Use Your Information">
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Authenticate you and manage your account session.</li>
          <li>Generate inspection reports and AI-assisted analysis from your uploaded photos.</li>
          <li>Store, organize, and let you export your reports as PDF or DOCX documents.</li>
          <li>Maintain the security and integrity of the service.</li>
        </ul>
      </Section>

      <Section title="AI-Assisted Analysis">
        <p>
          SiteLens uses artificial intelligence to analyze uploaded property photos and identify
          potential maintenance issues and cost estimates. AI results may be inaccurate or
          incomplete, especially for low-quality or ambiguous images. AI-generated findings should
          be reviewed and verified by a qualified professional before being relied upon for
          decisions. You are responsible for the final content of any report you produce.
        </p>
      </Section>

      <Section title="Data Storage and Security">
        <p>
          Your data is stored securely on the platform hosting this application. Access to your
          reports is restricted by row-level security so that only you (and organization
          administrators, where applicable) can view or modify them. We use reasonable technical and
          organizational measures to protect your information, but no system is perfectly secure.
        </p>
      </Section>

      <Section title="Data Sharing">
        <p>
          We do not sell your data. We share information only as necessary to operate the service
          (e.g., our hosting and AI providers under appropriate agreements), or where required by
          law. Reports you export and share with clients or colleagues are shared at your
          discretion.
        </p>
      </Section>

      <Section title="Your Rights">
        <p>
          You may view, edit, and delete your inspection reports at any time within the app. To
          request deletion of your account or associated data, contact the app owner.
        </p>
      </Section>

      <Section title="Children's Privacy">
        <p>SiteLens is intended for professional use and is not directed at children under 16. We do not knowingly collect their information.</p>
      </Section>

      <Section title="Changes to This Policy">
        <p>We may update this policy from time to time. Material changes will be reflected by the "Last updated" date above.</p>
      </Section>
    </div>
  );
}

function TermsOfUse() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Terms of Use</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 8, 2026</p>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        These Terms of Use govern your access to and use of SiteLens. By using the app, you agree to
        these terms. If you do not agree, do not use the app.
      </p>

      <Section title="License to Use">
        <p>
          We grant you a limited, non-exclusive, non-transferable license to use SiteLens for your
          internal property inspection and reporting purposes during the time you have access.
        </p>
      </Section>

      <Section title="Your Responsibilities">
        <p>You agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide accurate information and only upload content you have the right to use.</li>
          <li>Use the app lawfully and not interfere with its operation or security.</li>
          <li>Keep your account credentials confidential and not share them.</li>
        </ul>
      </Section>

      <Section title="AI-Generated Content">
        <p>
          SiteLens produces AI-assisted analysis and summaries. This output is provided for
          informational purposes only and is not a substitute for professional engineering,
          architectural, or inspection advice. We make no warranty as to the accuracy or
          completeness of AI-generated findings. You bear responsibility for reviewing and
          verifying all content before relying on or distributing it.
        </p>
      </Section>

      <Section title="Your Content">
        <p>
          You retain ownership of the inspection content you upload. You grant us a limited license
          to process that content solely to provide the app's features, including AI analysis,
          storage, and export.
        </p>
      </Section>

      <Section title="Acceptable Use">
        <p>You will not use SiteLens to upload unlawful, infringing, or harmful content, or to violate the rights of any third party or applicable law.</p>
      </Section>

      <Section title="Disclaimer of Warranties">
        <p>
          The app is provided "as is" without warranties of any kind, express or implied, including
          merchantability or fitness for a particular purpose. We do not guarantee that the app will
          be uninterrupted or error-free.
        </p>
      </Section>

      <Section title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, we are not liable for any indirect, incidental, or
          consequential damages arising from your use of the app, or for any reliance on
          AI-generated analysis.
        </p>
      </Section>

      <Section title="Termination">
        <p>We may suspend or terminate access if these terms are violated. You may stop using the app at any time and delete your reports within the app.</p>
      </Section>

      <Section title="Changes to These Terms">
        <p>We may update these terms from time to time. Continued use after changes constitutes acceptance of the revised terms.</p>
      </Section>
    </div>
  );
}