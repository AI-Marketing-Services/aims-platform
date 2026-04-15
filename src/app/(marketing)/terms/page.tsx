import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | AIMS",
  description: "AIMS terms of service - the agreement governing use of our platform and services.",
}

export default function TermsPage() {
  const lastUpdated = "April 15, 2026"

  return (
    <section className="py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_strong]:text-foreground">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the AIMS platform, website at
            aioperatorcollective.com, and all related services operated by Modern Amenities Group LLC
            (&ldquo;AIMS&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By accessing or using our
            services, you agree to be bound by these Terms.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By creating an account, subscribing to a plan, or using any AIMS service, you confirm that you have
            read, understood, and agree to these Terms. If you do not agree, do not use our services.
          </p>

          <h2>2. Services</h2>
          <p>
            AIMS provides AI implementation, consulting, and managed services for businesses. Our offerings include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>AI strategy consulting and implementation</li>
            <li>Managed AI operations and ongoing optimization</li>
            <li>The AI Operator Collective community and training program</li>
            <li>Self-service tools (AI Readiness Quiz, ROI Calculator, Website Audit, etc.)</li>
            <li>Digital products, playbooks, and educational content</li>
          </ul>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of our services at any time
            with reasonable notice.
          </p>

          <h2>3. Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activity under your account. You must provide accurate and complete information when creating
            an account and keep it up to date.
          </p>
          <p>
            You must be at least 18 years old to create an account. By creating an account, you represent
            that you have the legal authority to enter into these Terms.
          </p>

          <h2>4. Subscriptions and Payments</h2>
          <p>
            <strong>Billing:</strong> Paid plans are billed in advance on a monthly or annual basis through
            Stripe. By subscribing, you authorize us to charge the payment method on file.
          </p>
          <p>
            <strong>Cancellation:</strong> You may cancel your subscription at any time through your account
            portal. Cancellation takes effect at the end of your current billing period. We do not provide
            prorated refunds for partial billing periods.
          </p>
          <p>
            <strong>Price changes:</strong> We may adjust pricing with 30 days notice. Continued use after
            a price change constitutes acceptance of the new pricing.
          </p>
          <p>
            <strong>Refunds:</strong> For one-time purchases and service engagements, refund eligibility is
            determined on a case-by-case basis. Contact us within 14 days of purchase to request a refund.
          </p>

          <h2>5. AI Operator Collective</h2>
          <p>
            The AI Operator Collective is a membership community hosted on Mighty Networks. By joining, you
            also agree to the Mighty Networks terms of service. Additional community guidelines:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Be respectful and constructive in all interactions</li>
            <li>Do not spam, self-promote excessively, or solicit other members</li>
            <li>Do not share confidential community content (playbooks, recordings, resources) outside the community</li>
            <li>Do not misrepresent your affiliation with AIMS or the AI Operator Collective</li>
          </ul>
          <p>
            Violation of community guidelines may result in temporary suspension or permanent removal
            from the community without refund.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            All content, code, designs, playbooks, frameworks, tools, and materials provided through AIMS
            and the AI Operator Collective are the intellectual property of Modern Amenities Group LLC unless
            otherwise stated.
          </p>
          <p>
            <strong>Your license:</strong> We grant you a limited, non-exclusive, non-transferable license
            to use our materials for your own business purposes. You may not resell, redistribute, or
            publicly share our proprietary content without written permission.
          </p>
          <p>
            <strong>Your content:</strong> You retain ownership of any content you create or submit through
            our platform. By posting content in community spaces, you grant us a non-exclusive license to
            display and distribute that content within the platform.
          </p>

          <h2>7. Confidentiality</h2>
          <p>
            During the course of our engagement, both parties may share confidential information.
            Each party agrees to protect the other&rsquo;s confidential information with the same degree
            of care it uses for its own, and not less than reasonable care.
          </p>
          <p>
            Client business data, strategies, and internal information shared for AI implementation
            purposes will be treated as strictly confidential.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            AIMS provides AI consulting and implementation services on an &ldquo;as is&rdquo; basis. While
            we strive for accuracy and reliability:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not guarantee specific business outcomes, revenue increases, or cost savings</li>
            <li>AI-generated outputs should be reviewed by qualified humans before acting on them</li>
            <li>We are not liable for decisions made based on AI-generated analysis or recommendations</li>
            <li>Our total liability is limited to the amount you paid for services in the 12 months preceding the claim</li>
          </ul>

          <h2>9. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless AIMS, its officers, employees, and agents from any
            claims, damages, or expenses arising from your use of our services, violation of these Terms,
            or infringement of any third-party rights.
          </p>

          <h2>10. Data and Privacy</h2>
          <p>
            Our collection and use of personal data is governed by our{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            By using our services, you consent to our data practices as described therein.
          </p>
          <p>
            For AI implementation services, we may access your business data and third-party accounts
            as necessary to deliver the agreed-upon services. Access will be limited to what is required
            and will be revoked upon completion of the engagement unless otherwise agreed.
          </p>

          <h2>11. Termination</h2>
          <p>
            Either party may terminate the relationship at any time. We reserve the right to suspend
            or terminate your access to our services if you violate these Terms, fail to make required
            payments, or engage in conduct that is harmful to other users or our business.
          </p>

          <h2>12. Dispute Resolution</h2>
          <p>
            Any disputes arising from these Terms or your use of our services will first be addressed
            through good-faith negotiation. If negotiation fails, disputes will be resolved through
            binding arbitration in the state of Delaware, in accordance with the rules of the
            American Arbitration Association.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the State of
            Delaware, without regard to conflict of law principles.
          </p>

          <h2>14. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Material changes will be communicated via
            email or through the platform. Continued use of our services after changes take effect
            constitutes acceptance of the revised Terms.
          </p>

          <h2>15. Contact</h2>
          <p>
            For questions about these Terms, contact us at{" "}
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
