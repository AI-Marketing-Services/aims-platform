import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | AI Operators Collective",
  description:
    "AI Operators Collective privacy policy - how Modern-Amenities, LLC collects, uses, shares, and protects your personal information.",
}

export default function PrivacyPage() {
  const lastUpdated = "April 20, 2026"

  return (
    <section className="py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
          AI Operators Collective
        </p>
        <p className="text-xs text-muted-foreground mb-4">a division of Modern-Amenities, LLC</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

        <div className="mb-10 rounded-md border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            This Privacy Policy describes how <strong className="text-foreground">Modern-Amenities, LLC</strong>,
            doing business as <strong className="text-foreground">AI Operators Collective</strong>
            (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;), collects, uses, discloses, retains, and
            protects personal information when you visit aioperatorcollective.com (the &ldquo;Site&rdquo;), use
            our membership, training, coaching, community, tools, or other services (collectively, the
            &ldquo;Services&rdquo;), or otherwise interact with us. This Policy is incorporated into and forms
            part of our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            . By using the Services, you agree to this Policy.
          </p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_strong]:text-foreground [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2">

          <h2>1. Scope</h2>
          <p>
            This Policy applies to personal information collected through the Site and Services, through our
            marketing activities (including events, SMS, and email), and through our interactions with
            prospective and current Members, subscribers, participants, and website visitors. It does not apply
            to data practices of third parties we do not own or control, even if their services are linked to or
            integrated with ours. For third-party sites and services, consult their own privacy policies.
          </p>

          <h2>2. Who We Are (Controller)</h2>
          <p>
            For the purposes of applicable data-protection laws (including the EU/UK GDPR and U.S. state privacy
            laws), the <strong>controller</strong> (or equivalent) of your personal information is:
          </p>
          <p>
            <strong>Modern-Amenities, LLC</strong>
            <br />
            d/b/a AI Operators Collective
            <br />
            8 The Green, Suite A
            <br />
            Dover, DE 19901, USA
            <br />
            Email:{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>
          </p>

          <h2>3. Information We Collect</h2>

          <h3>a. Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account &amp; profile:</strong> name, email address, phone number, company name, job title, professional background, profile photo, time zone, and password (hashed).</li>
            <li><strong>Billing:</strong> billing name and address, last 4 digits of payment card, card brand, expiration, and transaction history. Full card numbers are processed by Stripe; we do not store them.</li>
            <li><strong>Forms &amp; interactive tools:</strong> responses to AI Readiness Quiz, ROI Calculator, Website Audit, Stack Configurator, Opportunity Audit, Executive Ops Audit, contact forms, surveys, application forms, and scheduling forms.</li>
            <li><strong>Member Win Reports:</strong> business contact info, client business type and industry, problem or operational challenge, AI solution deployed, measurable outcomes, and qualitative observations you voluntarily submit.</li>
            <li><strong>Community content:</strong> posts, comments, messages, reactions, uploaded files, testimonials, and feedback.</li>
            <li><strong>Communications:</strong> emails, SMS, support tickets, chat messages, and call recordings or transcripts when you interact with us.</li>
            <li><strong>Event &amp; coaching participation:</strong> attendance, participation in group calls and Q&amp;A sessions, recordings (video, audio, chat).</li>
          </ul>

          <h3>b. Information Collected Automatically</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Device &amp; technical data:</strong> IP address, device type, operating system, browser type, browser language, screen resolution, and unique device identifiers.</li>
            <li><strong>Usage data:</strong> pages viewed, links clicked, referring URL, entry/exit pages, time and date of access, session duration, scroll depth, and error logs.</li>
            <li><strong>Location:</strong> approximate geographic location derived from IP address.</li>
            <li><strong>Marketing attribution:</strong> UTM parameters, click IDs, and referring campaign data.</li>
            <li><strong>Cookies &amp; similar technologies:</strong> see Section 8.</li>
          </ul>

          <h3>c. Information from Third Parties</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Authentication and identity providers (e.g., Clerk) when you sign in using those services.</li>
            <li>Payment processors (e.g., Stripe) for billing and fraud prevention.</li>
            <li>CRM and marketing platforms (e.g., Close) for lead-source and engagement data.</li>
            <li>Analytics providers and advertising partners.</li>
            <li>Referral partners who refer you to us.</li>
            <li>Publicly available sources and social media profiles you make public.</li>
          </ul>

          <h3>d. Sensitive Information</h3>
          <p>
            We do not intentionally collect sensitive personal information (such as government IDs, precise
            geolocation, health information, biometric data, or financial account numbers). Please do not submit
            sensitive information through the Services unless required for a specific feature and expressly
            requested.
          </p>

          <h2>4. How We Use Your Information</h2>
          <p>We use personal information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, operate, maintain, secure, and improve the Services;</li>
            <li>Create, authenticate, and manage your account;</li>
            <li>Process payments, subscriptions, renewals, refunds, and chargebacks;</li>
            <li>Deliver curriculum, coaching, events, community, and benchmarking features;</li>
            <li>Personalize content and recommendations;</li>
            <li>Communicate with you, including transactional messages, service announcements, policy updates, onboarding, support replies, and security notifications;</li>
            <li>Send marketing communications by email, SMS, or otherwise with your consent (which you may withdraw at any time);</li>
            <li>Conduct research, analytics, benchmarking, trend analysis, and product development, including training machine-learning models in aggregated or de-identified form;</li>
            <li>Generate anonymized proof points, case studies, and program materials (attributed use requires your prior written consent);</li>
            <li>Measure and optimize advertising and marketing campaigns;</li>
            <li>Prevent, investigate, and address fraud, abuse, security incidents, and violations of our Terms;</li>
            <li>Comply with legal obligations, respond to lawful requests, and enforce our rights and agreements.</li>
          </ul>

          <h2>5. Legal Bases for Processing (EU/UK Users)</h2>
          <p>If you are located in the EU, UK, or EEA, we rely on the following legal bases:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Contract:</strong> to provide the Services you requested and administer your account;</li>
            <li><strong>Legitimate interests:</strong> to operate, secure, improve, and market our business, subject to your rights and interests;</li>
            <li><strong>Consent:</strong> for certain marketing communications, SMS, non-essential cookies, and recording of calls (you may withdraw consent at any time);</li>
            <li><strong>Legal obligation:</strong> to comply with applicable law, regulation, or legal process; and</li>
            <li><strong>Vital interests / public interest:</strong> in rare cases where necessary to protect vital interests or perform a task in the public interest.</li>
          </ul>

          <h2>6. How We Share Information</h2>
          <p>
            We do <strong>not</strong> sell your personal information for monetary consideration. We share
            personal information only as described below.
          </p>

          <h3>a. Service Providers (Processors)</h3>
          <p>
            We share personal information with vendors that process data on our behalf under written agreements
            that restrict their use to providing services to us, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Hosting &amp; infrastructure:</strong> Vercel, Neon (Postgres)</li>
            <li><strong>Authentication:</strong> Clerk</li>
            <li><strong>Payments:</strong> Stripe</li>
            <li><strong>Email delivery:</strong> Resend</li>
            <li><strong>SMS delivery:</strong> our SMS provider and carriers</li>
            <li><strong>CRM &amp; sales automation:</strong> Close</li>
            <li><strong>Community platform:</strong> Mighty Networks</li>
            <li><strong>Analytics:</strong> Vercel Analytics and similar privacy-respecting analytics</li>
            <li><strong>AI &amp; enrichment providers:</strong> Anthropic, Google, Firecrawl, OpenAI (where used for specific features)</li>
            <li><strong>Caching &amp; rate-limiting:</strong> Upstash</li>
            <li><strong>Link management &amp; attribution:</strong> Dub.co</li>
            <li><strong>Scheduling:</strong> our booking provider for calls (e.g., Cal.com or Calendly)</li>
            <li><strong>Customer support:</strong> help-desk, ticketing, and internal collaboration tools</li>
          </ul>
          <p>
            The list of processors may change. If you would like an up-to-date list, contact{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>
            .
          </p>

          <h3>b. Affiliates</h3>
          <p>
            We may share personal information with affiliated entities under common ownership or control, subject
            to this Policy.
          </p>

          <h3>c. Advertising &amp; Marketing Partners</h3>
          <p>
            We may share limited identifiers and event data with advertising partners to measure and optimize
            marketing campaigns. Under certain state privacy laws, some of these disclosures may constitute a
            &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of personal information. See Section 13 for your right to
            opt out.
          </p>

          <h3>d. Legal, Compliance &amp; Safety</h3>
          <p>
            We may disclose personal information when we believe in good faith that disclosure is necessary to
            (i) comply with a law, regulation, subpoena, court order, or other legal process; (ii) enforce or
            apply our Terms and other agreements; (iii) protect the rights, property, or safety of AI Operators
            Collective, our Members, or the public; (iv) investigate or prevent fraud, abuse, or security
            incidents; or (v) respond to claims that content violates third-party rights.
          </p>

          <h3>e. Business Transfers</h3>
          <p>
            If we engage in a merger, acquisition, financing, reorganization, bankruptcy, receivership, dissolution,
            sale of all or a portion of our assets, or similar transaction, your personal information may be
            transferred as part of that transaction. We will notify you (e.g., by posting a notice on the Site)
            if we become subject to different privacy practices as a result.
          </p>

          <h3>f. With Your Direction or Consent</h3>
          <p>We may share personal information with your consent or at your direction (for example, when you publish a post in the community or authorize an integration).</p>

          <h3>g. Aggregated &amp; De-Identified Information</h3>
          <p>
            We may create and share aggregated, anonymized, or de-identified information that cannot reasonably
            be used to identify you, for any lawful purpose, including benchmarking, research, marketing, and
            product development.
          </p>

          <h2>7. Member Win Reports &amp; Benchmarking</h2>
          <p>
            If you submit Member Win Reports, we use the information to (a) generate aggregate benchmarks and
            collective insights; (b) refine Operator IP, frameworks, and curriculum; (c) produce anonymized
            proof-points and case studies; and (d) show you comparative analysis against anonymized collective
            data. Individually identifying details are never shared in a manner that could reasonably identify
            you or your client without your prior written approval. You are responsible for obtaining any
            necessary consent from your own clients before submitting data about them.
          </p>

          <h2>8. Cookies &amp; Similar Technologies</h2>
          <p>We use cookies, pixels, SDKs, local storage, and similar technologies to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Strictly necessary:</strong> authenticate sessions, enable checkout, prevent fraud, and maintain security;</li>
            <li><strong>Functional:</strong> remember your preferences and settings;</li>
            <li><strong>Analytics:</strong> measure performance, usage, and errors;</li>
            <li><strong>Marketing &amp; attribution:</strong> measure the effectiveness of our campaigns and attribute conversions.</li>
          </ul>
          <p>
            Most browsers let you control cookies through their settings. Blocking strictly necessary cookies may
            break core functionality. Where required by law, we will obtain consent before setting non-essential
            cookies.
          </p>

          <h2>9. Do Not Track &amp; Global Privacy Control (GPC)</h2>
          <p>
            Browsers may transmit a &ldquo;Do Not Track&rdquo; signal. Because there is no industry consensus on
            how DNT should be interpreted, we do not respond to DNT. Where required by law (including California
            and other U.S. states that recognize Global Privacy Control), we will treat a valid GPC signal as a
            request to opt out of the &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of personal information for
            cross-context behavioral advertising for the browser or device from which the signal is sent.
          </p>

          <h2>10. SMS / Text Messaging Privacy</h2>
          <p>
            If you opt in to SMS, we (and our SMS provider) will process your mobile number, opt-in record, and
            message metadata. We do not sell or share mobile phone numbers collected for SMS to third parties or
            affiliates for their own marketing. Carriers may apply message and data rates. You can opt out at any
            time by texting <strong>STOP</strong>. Full SMS program terms are in our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            .
          </p>

          <h2>11. Children&rsquo;s Privacy</h2>
          <p>
            The Services are intended for adults aged 18 and older. We do not knowingly collect personal
            information from children under 13 (or under 16 in the EU/UK). If we learn that we have collected
            personal information from a child, we will delete it promptly. If you believe we may have information
            from a minor, contact{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>
            .
          </p>

          <h2>12. Your Privacy Rights (General)</h2>
          <p>Subject to applicable law and verification, you may request to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> receive a copy of the personal information we hold about you;</li>
            <li><strong>Correct:</strong> correct inaccurate or incomplete personal information;</li>
            <li><strong>Delete:</strong> delete your personal information, subject to legal retention requirements;</li>
            <li><strong>Port:</strong> receive your personal information in a structured, commonly used, machine-readable format;</li>
            <li><strong>Restrict or object:</strong> restrict or object to certain processing, including for marketing or legitimate interests;</li>
            <li><strong>Withdraw consent:</strong> where processing is based on consent, withdraw it without affecting the lawfulness of processing prior to withdrawal;</li>
            <li><strong>Opt out:</strong> unsubscribe from marketing emails via the unsubscribe link (or at{" "}
              <Link href="/unsubscribe" className="text-primary hover:underline">
                /unsubscribe
              </Link>
              ), opt out of SMS by texting STOP, and opt out of sales/sharing under state laws.
            </li>
          </ul>
          <p>
            To exercise any right, email{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>{" "}
            with sufficient detail for us to locate your records. We will respond within the period required by
            applicable law (generally 30 days). We may need to verify your identity before acting. We will not
            discriminate against you for exercising these rights.
          </p>

          <h2>13. U.S. State Privacy Rights (CCPA/CPRA, VA, CO, CT, UT, and other states)</h2>
          <p>
            Residents of California, Colorado, Connecticut, Virginia, Utah, and other U.S. states with
            comprehensive privacy laws may have additional rights, including the rights to know, access, delete,
            correct, and port personal information; to opt out of the &ldquo;sale&rdquo; or &ldquo;sharing&rdquo;
            of personal information for cross-context behavioral advertising; to opt out of certain profiling;
            and to limit the use of sensitive personal information. You may also designate an authorized agent
            to submit requests on your behalf.
          </p>
          <p>
            <strong>California &ldquo;Shine the Light&rdquo; (Civil Code &sect; 1798.83):</strong> California
            residents may request information about disclosures of personal information to third parties for
            direct-marketing purposes during the immediately preceding calendar year. We do not currently share
            personal information with third parties for their own direct marketing.
          </p>
          <p>
            <strong>Notice of Financial Incentive:</strong> If we offer any price or service difference related
            to data practices (e.g., discounts for newsletter sign-up), we will describe the material terms and
            your right to withdraw at the point of collection.
          </p>
          <p>
            <strong>No Sale of Sensitive PI; No Sale of Minors&rsquo; PI:</strong> We do not knowingly sell
            sensitive personal information or personal information of consumers under 16.
          </p>
          <p>
            To submit a request or appeal a decision, email{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>{" "}
            with &ldquo;State Privacy Request&rdquo; in the subject line.
          </p>

          <h3>a. Categories of Personal Information Collected &amp; Disclosed (last 12 months)</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Identifiers:</strong> name, email, phone, account IDs, IP address &mdash; collected from you and automatically; disclosed to service providers (hosting, auth, email, SMS, payments, CRM, analytics).</li>
            <li><strong>Customer records:</strong> billing name, payment-card metadata &mdash; collected from you; disclosed to payment processors.</li>
            <li><strong>Commercial:</strong> purchase history, subscription status &mdash; collected from you and from Stripe; disclosed to service providers.</li>
            <li><strong>Internet/network activity:</strong> usage data, interactions, device/browser info &mdash; collected automatically; disclosed to hosting and analytics providers.</li>
            <li><strong>Geolocation (approximate):</strong> derived from IP &mdash; collected automatically; disclosed to hosting and analytics providers.</li>
            <li><strong>Audio/visual:</strong> call recordings and photos you upload &mdash; collected from you; disclosed to hosting and collaboration providers.</li>
            <li><strong>Professional/employment:</strong> company, role, industry &mdash; collected from you; disclosed to CRM and community platforms.</li>
            <li><strong>Inferences:</strong> preferences, interests, engagement scores &mdash; derived by us; used internally and with analytics providers.</li>
          </ul>

          <h2>14. EU/UK (GDPR) Rights</h2>
          <p>If you are in the EU, UK, or EEA, you have the rights to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access, rectify, or erase your personal data;</li>
            <li>Restrict or object to processing;</li>
            <li>Data portability;</li>
            <li>Withdraw consent at any time (without affecting the lawfulness of processing prior to withdrawal);</li>
            <li>Lodge a complaint with your local supervisory authority; and</li>
            <li>Not be subject to decisions based solely on automated processing that produce legal or similarly significant effects.</li>
          </ul>
          <p>
            We rely on appropriate safeguards for international data transfers, including the European
            Commission&rsquo;s Standard Contractual Clauses and the UK International Data Transfer Addendum,
            where applicable. Contact{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>{" "}
            to obtain a copy of the relevant safeguards.
          </p>

          <h2>15. International Data Transfers</h2>
          <p>
            We are based in the United States and process personal information in the U.S. and in other countries
            where our service providers operate. Laws in these countries may differ from those in your country.
            Where required, we use appropriate legal mechanisms (such as Standard Contractual Clauses) to protect
            international transfers. By using the Services, you acknowledge the transfer and processing of your
            data in the U.S. and other jurisdictions.
          </p>

          <h2>16. Data Retention</h2>
          <p>
            We retain personal information for as long as necessary to deliver the Services, comply with our
            legal obligations, resolve disputes, and enforce our agreements. Typical retention:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account data:</strong> duration of your membership plus up to 24 months, unless longer retention is required or permitted by law;</li>
            <li><strong>Billing records:</strong> at least 7 years for tax and accounting purposes;</li>
            <li><strong>Support communications:</strong> up to 3 years;</li>
            <li><strong>Marketing contacts:</strong> until you unsubscribe or 3 years of inactivity, whichever is earlier;</li>
            <li><strong>Security logs:</strong> up to 2 years;</li>
            <li><strong>Aggregated/de-identified data:</strong> indefinitely.</li>
          </ul>
          <p>
            After the retention period, we will delete or anonymize personal information unless we are legally
            required to keep it.
          </p>

          <h2>17. Data Security</h2>
          <p>
            We maintain administrative, technical, and physical safeguards designed to protect personal
            information, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption in transit (TLS) and at rest where feasible;</li>
            <li>Role-based access controls and least-privilege principles;</li>
            <li>Logging, monitoring, and intrusion detection;</li>
            <li>Background checks and training for personnel with access to sensitive data;</li>
            <li>Vendor due diligence and written data-protection terms with processors.</li>
          </ul>
          <p>
            No method of transmission or storage is 100% secure. We cannot guarantee absolute security. You are
            responsible for safeguarding your account credentials.
          </p>

          <h2>18. Data Breach Notification</h2>
          <p>
            In the event of a data breach affecting your personal information, we will notify you and applicable
            regulators without undue delay, in accordance with applicable law.
          </p>

          <h2>19. Automated Decisions &amp; Profiling</h2>
          <p>
            We may use automated processing (including basic profiling for analytics, segmentation, fraud
            prevention, and personalization). We do not make decisions that produce legal or similarly
            significant effects based solely on automated processing. Where required by law, you may request
            human review of such decisions.
          </p>

          <h2>20. Third-Party Links, Tools &amp; Integrations</h2>
          <p>
            The Services may link to or integrate with third-party websites, applications, payment processors,
            AI models, CRMs, calendars, and other tools. Those third parties operate under their own privacy
            policies. We are not responsible for their practices. Review their policies before providing
            personal information.
          </p>

          <h2>21. Changes to This Policy</h2>
          <p>
            We may update this Policy from time to time. The &ldquo;Last Updated&rdquo; date above reflects the
            most recent revision. If we make material changes, we will provide additional notice (for example,
            by email or a prominent notice on the Site). Your continued use of the Services after changes take
            effect constitutes acceptance.
          </p>

          <h2>22. Contact Us</h2>
          <p>For privacy questions, requests, or complaints:</p>
          <p>
            <strong>Modern-Amenities, LLC</strong>
            <br />
            d/b/a AI Operators Collective
            <br />
            8 The Green, Suite A
            <br />
            Dover, DE 19901
            <br />
            Privacy:{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>
            <br />
            Legal:{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>
            <br />
            Support:{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>
          </p>
          <p>
            For unresolved complaints, EU/UK residents may contact their local data-protection authority.
            California residents may contact the California Privacy Protection Agency.
          </p>
        </div>
      </div>
    </section>
  )
}
