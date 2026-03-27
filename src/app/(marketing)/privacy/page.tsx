import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | AIMS",
  description: "AIMS privacy policy - how we collect, use, and protect your data.",
}

export default function PrivacyPage() {
  const lastUpdated = "March 26, 2026"

  return (
    <section className="py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_strong]:text-foreground">
          <p>
            AIMS (&ldquo;AI Managing Services&rdquo;), a division of Modern Amenities Group LLC (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;),
            is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information
            when you visit aimseos.com or use our services.
          </p>

          <h2>Information We Collect</h2>
          <p>
            <strong>Information you provide:</strong> Name, email address, company name, phone number, and any data you
            submit through our forms (AI Readiness Quiz, ROI Calculator, Website Audit, contact forms).
          </p>
          <p>
            <strong>Automatically collected:</strong> IP address, browser type, pages visited, referring URL, and UTM
            parameters. We use cookies and analytics tools to understand site usage.
          </p>
          <p>
            <strong>Account data:</strong> If you create an account, we store your profile information, subscription
            details, and service usage data through our authentication provider (Clerk).
          </p>

          <h2>How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and improve our AI services and platform</li>
            <li>To process payments and manage subscriptions (via Stripe)</li>
            <li>To send transactional emails (account updates, support replies, service notifications)</li>
            <li>To send marketing communications (with your consent, which you can withdraw at any time)</li>
            <li>To personalize your experience and provide relevant recommendations</li>
            <li>To analyze site usage and improve our website</li>
          </ul>

          <h2>Data Sharing</h2>
          <p>
            We do not sell your personal information. We share data only with service providers necessary
            to operate our platform:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Stripe</strong> for payment processing</li>
            <li><strong>Clerk</strong> for authentication</li>
            <li><strong>Resend</strong> for email delivery</li>
            <li><strong>Vercel</strong> for hosting and analytics</li>
            <li><strong>Anthropic / Google</strong> for AI service delivery</li>
          </ul>

          <h2>Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide services.
            You may request deletion of your data at any time by contacting us.
          </p>

          <h2>Your Rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access, correct, or delete your personal data</li>
            <li>Opt out of marketing emails via our <Link href="/unsubscribe" className="text-primary hover:underline">unsubscribe page</Link></li>
            <li>Request a copy of your data</li>
            <li>Withdraw consent for data processing</li>
          </ul>

          <h2>Security</h2>
          <p>
            We use industry-standard security measures including encryption in transit (TLS),
            encrypted storage, and access controls. However, no method of transmission over
            the internet is 100% secure.
          </p>

          <h2>Contact</h2>
          <p>
            For privacy questions or data requests, contact us at{" "}
            <a href="mailto:irtaza@modern-amenities.com" className="text-primary hover:underline">
              irtaza@modern-amenities.com
            </a>
          </p>
          <p>
            Modern Amenities Group LLC<br />
            8 The Green, Suite A<br />
            Dover, DE 19901
          </p>
        </div>
      </div>
    </section>
  )
}
