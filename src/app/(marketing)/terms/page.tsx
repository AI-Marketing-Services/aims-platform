import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | AI Operators Collective",
  description: "AI Operators Collective terms of service, membership agreement, and data policies.",
}

export default function TermsPage() {
  const lastUpdated = "April 20, 2026"

  return (
    <section className="py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
          AI Operators Collective
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          a division of Modern-Amenities, LLC
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

        <div className="mb-10 rounded-md border border-primary/40 bg-primary/5 p-4">
          <p className="text-foreground font-semibold text-sm uppercase tracking-wide mb-2">
            Important Notice -- Please Read Carefully
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            THESE TERMS CONTAIN A BINDING INDIVIDUAL ARBITRATION AGREEMENT, A CLASS-ACTION WAIVER, A JURY-TRIAL
            WAIVER, A CAP ON OUR LIABILITY, A ONE-YEAR LIMITATION ON CLAIMS, AND A REQUIREMENT THAT YOU GIVE US
            NOTICE AND AN OPPORTUNITY TO RESOLVE DISPUTES BEFORE INITIATING A CHARGEBACK, ARBITRATION, OR SUIT.
            PLEASE READ SECTIONS 28&ndash;32 CAREFULLY. YOU MAY OPT OUT OF ARBITRATION WITHIN 30 DAYS OF FIRST
            ACCEPTING THESE TERMS BY FOLLOWING THE PROCEDURE IN SECTION 30(f).
          </p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_strong]:text-foreground [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2">

          <h2>1. Acceptance of Terms</h2>
          <p>
            These Terms of Service (&ldquo;<strong>Terms</strong>&rdquo;) are a legally binding agreement between
            you (&ldquo;<strong>you</strong>,&rdquo; &ldquo;<strong>Member</strong>,&rdquo;
            &ldquo;<strong>Participant</strong>&rdquo;) and <strong>Modern-Amenities, LLC</strong>, a Delaware
            limited liability company doing business as AI Operators Collective (&ldquo;<strong>AI Operators
            Collective</strong>,&rdquo; &ldquo;<strong>Company</strong>,&rdquo; &ldquo;<strong>we</strong>,&rdquo;
            &ldquo;<strong>us</strong>,&rdquo; or &ldquo;<strong>our</strong>&rdquo;). By accessing
            aioperatorcollective.com or any related site, subdomain, application, or tool operated by us
            (collectively, the &ldquo;<strong>Site</strong>&rdquo;); purchasing, enrolling in, or accessing any
            membership, subscription, course, program, community, content, coaching, advisory program, event, or
            digital product (collectively, the &ldquo;<strong>Services</strong>&rdquo;); submitting any data,
            content, or win report; opting in to receive SMS or email communications; or clicking
            &ldquo;I Agree,&rdquo; &ldquo;Submit,&rdquo; or any similar acceptance control, you agree to be bound
            by these Terms and by our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            , which is incorporated by reference.
          </p>
          <p>
            If you access the Services on behalf of a company, organization, or other legal entity, you represent
            and warrant that you have full legal authority to bind that entity to these Terms, and references to
            &ldquo;you&rdquo; include that entity.
          </p>
          <p className="text-foreground font-semibold">
            IF YOU DO NOT AGREE TO EVERY PART OF THESE TERMS, YOU MUST NOT ACCESS OR USE THE SERVICES, MUST NOT
            CLICK ANY ACCEPTANCE CONTROL, AND MUST NOT SUBMIT ANY DATA OR PAYMENT.
          </p>

          <h2>2. Definitions</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Content</strong> means all text, data, videos, audio, images, code, frameworks, playbooks, templates, benchmarks, analytics, curriculum, software, and materials made available through the Services.</li>
            <li><strong>Member Content</strong> means content you submit, post, upload, or transmit through the Services, including win reports, community posts, messages, feedback, and materials you share with other members.</li>
            <li><strong>Win Report</strong> means a standardized submission describing a client engagement, AI deployment, problem, solution, or outcome.</li>
            <li><strong>Member Data</strong> means personal information, account data, engagement data, and Member Content associated with your account.</li>
          </ul>

          <h2>3. The Services</h2>
          <p>The Services include, without limitation:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Educational content, curriculum modules, frameworks, playbooks, templates, tools, and live or recorded coaching through the AI Advisory Program</li>
            <li>The AI Operators Collective member platform: a subscription-based training and advisory community</li>
            <li>Member Win Reporting and benchmarking systems</li>
            <li>Community forums, events, group calls, and member-to-member interactions</li>
            <li>SMS, MMS, and email communications, including program updates, event reminders, promotional offers, account notifications, and support</li>
            <li>Any additional features, tools, or services we may introduce from time to time</li>
          </ul>
          <p>
            We may change, suspend, discontinue, limit, or remove any portion of the Services at any time, for any
            reason, with or without notice. Features, pricing, and availability are subject to change.
          </p>

          <h2>4. Eligibility</h2>
          <p>To access the Services, you represent and warrant that:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are at least 18 years of age and have the legal capacity to enter into a binding contract;</li>
            <li>You are not located in, under the control of, or a national or resident of any U.S.-embargoed country, and you are not on any U.S. government list of prohibited or restricted parties (including the Specially Designated Nationals list and the Denied Persons List);</li>
            <li>You have not previously been suspended, terminated, or banned from the Services;</li>
            <li>Your use of the Services will not violate any applicable law, regulation, or third-party right; and</li>
            <li>All information you provide is true, accurate, current, and complete.</li>
          </ul>

          <h2>5. Account Security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials and for all activity
            that occurs under your account. You must notify us immediately at{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>{" "}
            of any unauthorized access, use, or security breach. We are not liable for any loss or damage arising
            from your failure to safeguard your credentials. You may not share, sell, transfer, or assign your
            account, and you may not let any other person access the Services using your account.
          </p>

          <h2>6. Electronic Communications &amp; Signatures Consent</h2>
          <p>
            By using the Services, you consent to receive communications from us in electronic form, including
            emails, in-app messages, SMS/MMS, and notices posted on the Site. You agree that all agreements,
            notices, disclosures, and other communications that we provide electronically satisfy any legal
            requirement that such communications be in writing. You further agree that any electronic signature,
            click-to-accept, or similar action by you has the same legal effect as a handwritten signature under
            the U.S. Electronic Signatures in Global and National Commerce Act (E-SIGN Act) and applicable state
            law.
          </p>

          <h2>7. SMS / Text Messaging Program</h2>

          <h3>a. Program Description</h3>
          <p>
            SMS and MMS communications may include community updates, event reminders, promotional offers, account
            notifications, onboarding messages, billing alerts, and member support.
          </p>

          <h3>b. Opt-In Consent</h3>
          <p>
            By providing your mobile number, checking an opt-in box, texting a keyword, or verbally consenting,
            you expressly authorize us to send recurring automated messages using an automatic telephone dialing
            system or equivalent technology. Consent is not a condition of purchasing any product or service.
          </p>

          <h3>c. Message Frequency</h3>
          <p>Message frequency varies and may include multiple messages per week.</p>

          <h3>d. Opt-Out</h3>
          <p>
            You may cancel SMS service at any time by texting <strong>STOP</strong> to any message you receive
            from us. A confirmation message will follow. Opting out of SMS does not opt you out of email or
            account notifications that are necessary to deliver the Services.
          </p>

          <h3>e. Help</h3>
          <p>
            Reply <strong>HELP</strong> or contact{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>{" "}
            for assistance.
          </p>

          <h3>f. Carriers, Rates &amp; Delivery</h3>
          <p>
            Carriers are not liable for delayed or undelivered messages. Message and data rates may apply.
            Supported carriers may change without notice. We do not guarantee the delivery, timing, or content of
            any SMS or MMS message.
          </p>

          <h3>g. Privacy</h3>
          <p>
            For privacy-related information, please refer to our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <h2>8. Fees, Subscriptions &amp; Auto-Renewal</h2>
          <p>
            All fees are stated at the time of purchase and are payable in U.S. dollars unless otherwise specified.
            Current subscription tiers are as follows:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-md">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="text-left px-4 py-3 text-foreground font-semibold">Tier</th>
                  <th className="text-left px-4 py-3 text-foreground font-semibold">Annual (upfront)</th>
                  <th className="text-left px-4 py-3 text-foreground font-semibold">Annual Renewal</th>
                  <th className="text-left px-4 py-3 text-foreground font-semibold">Month-to-Month</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 text-foreground font-medium">Community</td>
                  <td className="px-4 py-3">$12,000</td>
                  <td className="px-4 py-3">$12,000/yr</td>
                  <td className="px-4 py-3">$1,500/mo</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-3 text-foreground font-medium">Accelerator</td>
                  <td className="px-4 py-3">$18,000</td>
                  <td className="px-4 py-3">$18,000/yr</td>
                  <td className="px-4 py-3">$1,750/mo</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-foreground font-medium">Inner Circle</td>
                  <td className="px-4 py-3">$24,000</td>
                  <td className="px-4 py-3">$24,000/yr</td>
                  <td className="px-4 py-3">$2,000/mo</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            Fees and tier features are subject to change. Current offer details are posted at
            aioperatorcollective.com. Changes to pricing will not affect active annual memberships during the
            current term.
          </p>

          <h3>a. Auto-Renewal Authorization</h3>
          <p className="text-foreground font-semibold uppercase tracking-wide text-xs leading-relaxed">
            BY ENROLLING IN A SUBSCRIPTION, YOU EXPRESSLY AUTHORIZE US (AND OUR PAYMENT PROCESSORS) TO
            AUTOMATICALLY CHARGE YOUR DESIGNATED PAYMENT METHOD ON A RECURRING BASIS AT THE THEN-CURRENT RATE FOR
            EACH SUCCESSIVE BILLING PERIOD UNTIL YOU CANCEL. SUBSCRIPTIONS WILL AUTOMATICALLY RENEW AT THE END OF
            EACH BILLING PERIOD UNLESS CANCELED IN ACCORDANCE WITH SECTION 10.
          </p>

          <h3>b. Payment Method; Authorization to Charge</h3>
          <p>
            You authorize us to charge your payment method for all fees, applicable taxes, and other amounts due.
            If a charge fails, we may suspend access, retry the charge, and pursue collection. You are responsible
            for keeping your payment information current.
          </p>

          <h3>c. Payment Plans</h3>
          <p>
            If you elect a payment plan, each installment is a non-refundable partial payment toward the total
            price. Late or failed installments may result in immediate suspension of access, acceleration of the
            remaining balance, late fees up to the maximum permitted by law, and referral to collections.
          </p>

          <h3>d. Promotional Pricing</h3>
          <p>
            Introductory, promotional, or discounted pricing applies only to the initial term specified. After the
            initial term, subscriptions renew at the standard rate then in effect. We reserve the right to
            terminate or modify any promotional offer at any time.
          </p>

          <h3>e. California Auto-Renewal Disclosures</h3>
          <p>
            <strong>California residents:</strong> Your subscription will continue until you cancel. You may
            cancel online, by email to{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>
            , or through any other method we make available. Cancellation will be effective at the end of the
            then-current billing period.
          </p>

          <h2>9. Refund Policy</h2>

          <h3>a. Annual Members</h3>
          <p>
            AI Operators Collective offers a 30-day refund window for annual memberships. You may request a full
            refund within 30 days of the Effective Date if you determine the program is not a fit. After 30 days,
            annual fees are non-refundable.
          </p>
          <p>
            To request a refund, you must email{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>{" "}
            within the 30-day window. Refunds, if approved, are processed within 15 business days to the original
            payment method.
          </p>

          <h3>b. Month-to-Month Members</h3>
          <p>Monthly fees are non-refundable for any month in which access has been provided.</p>

          <h3>c. Digital Products &amp; Downloads</h3>
          <p>
            Because digital products are delivered immediately, all sales of single-purchase digital products,
            downloads, templates, and one-time courses are final and non-refundable unless expressly stated at
            the point of purchase or required by applicable law.
          </p>

          <h3>d. Clarifications</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>This is a training and community membership program, not a franchise, business opportunity, or guaranteed income program</li>
            <li>Results depend on your effort, market conditions, and individual execution</li>
            <li>AI Operators Collective does not guarantee specific revenue, client acquisition, or business outcomes</li>
            <li>No refund is owed for dissatisfaction with the pace of your own results, the pace at which you consume content, or disagreements with community opinions</li>
          </ul>

          <h2>10. Cancellation</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Annual memberships may not be cancelled mid-term except as provided in Section 9. No pro-rated refunds are issued for unused months.</li>
            <li>Month-to-month memberships may be cancelled with 30 days written notice to <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">support@aioperatorcollective.com</a>. Cancellation takes effect at the end of the then-current billing period. No partial-month refunds.</li>
            <li>Upon cancellation or non-renewal, your access to all program materials, community, and resources is terminated.</li>
            <li>We may also cancel, suspend, or terminate your access as set forth in Section 26.</li>
          </ul>

          <h2>11. Chargebacks &amp; Payment Disputes</h2>
          <p>
            If you believe a charge is in error, you agree to first contact us at{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>{" "}
            and provide us at least 15 business days to investigate and resolve the dispute before initiating a
            chargeback, reversal, or dispute with your bank or card issuer. Initiating a chargeback without first
            contacting us is a material breach of these Terms. We reserve the right to (a) suspend or terminate
            your access immediately upon any chargeback; (b) contest any chargeback we believe is invalid,
            including by providing evidence of your acceptance of these Terms and your access to the Services;
            and (c) recover from you any chargeback, reversal, bank fees, collection costs, and reasonable
            attorneys&rsquo; fees we incur. Re-enrollment after an invalid chargeback may be refused at our sole
            discretion.
          </p>

          <h2>12. Taxes</h2>
          <p>
            Fees are exclusive of all applicable taxes, duties, levies, tariffs, and similar charges
            (collectively, &ldquo;<strong>Taxes</strong>&rdquo;), except taxes imposed on our net income. You are
            solely responsible for all Taxes associated with your purchase and use of the Services. If we are
            required by law to collect Taxes, we may invoice and collect them from you.
          </p>

          <h2>13. Earnings, Results &amp; FTC Disclosures</h2>
          <p>
            AI Operators Collective does not and cannot guarantee specific revenue, client acquisition, income,
            or business outcomes. Examples of results shared in the program, including Member win reports, case
            studies, testimonials, transcripts, and screenshots, are <strong>not typical</strong> and are
            provided for illustrative purposes only. Your individual results will vary based on effort, market,
            execution, experience, capital, prior skills, and factors outside our control.
          </p>
          <p>
            Any income, revenue, or ROI figures referenced in our marketing, curriculum, or case studies reflect
            the results of specific members at a specific time and do not represent a promise, prediction, or
            guarantee of your results. We comply with the U.S. Federal Trade Commission&rsquo;s Endorsement
            Guides and any applicable state &ldquo;Business Opportunity&rdquo; or &ldquo;Coaching&rdquo; rules;
            you acknowledge that our disclosures are conspicuous and that you are not relying on any earnings
            claim in deciding to purchase.
          </p>

          <h2>14. No Professional Advice</h2>
          <p>
            The Services are educational and informational only. Nothing in the Services constitutes legal, tax,
            accounting, financial, investment, medical, psychological, or other professional advice. You should
            consult your own qualified professional advisors before making any decision with legal, tax,
            financial, or health implications. We are not your attorney, accountant, fiduciary, therapist,
            broker, or adviser, and no attorney-client, fiduciary, or similar relationship is created by your use
            of the Services.
          </p>

          <h2>15. Data Submission -- Member Win Reporting</h2>

          <h3>a. Data You Provide</h3>
          <p>
            As a Member, you may voluntarily submit Win Reports through the standardized reporting template.
            Data submitted may include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Business contact information (name, email, phone, company name)</li>
            <li>Client business type and industry</li>
            <li>Problem or operational challenge addressed</li>
            <li>AI solution deployed (tools, frameworks, workflows used)</li>
            <li>Measurable outcomes (time savings, revenue impact, cost reduction, efficiency gains)</li>
            <li>Qualitative observations on team or operational changes</li>
          </ul>

          <h3>b. Your Representations</h3>
          <p>
            You represent and warrant that: (a) you have the legal authority to provide all submitted data;
            (b) all data submitted is accurate and complete to the best of your knowledge; (c) your submission
            does not violate any third-party rights, confidentiality obligation, or applicable law; and (d) you
            have obtained any necessary consent from your own clients before including any client information in
            any submission.
          </p>

          <h2>16. Data Collection, Privacy &amp; Your Data Rights</h2>

          <h3>a. What We Collect</h3>
          <p>In delivering the Services, we may collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Member profile data: name, contact information, professional background</li>
            <li>Engagement data: call attendance, module activity, and community participation</li>
            <li>Member Win Report data</li>
            <li>Client-adjacent data you choose to include in Win Reports</li>
            <li>Technical and usage data (see our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>)</li>
          </ul>

          <h3>b. How We Use Data</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Deliver and improve the Services</li>
            <li>Generate aggregate insights across the collective to improve Operator IP</li>
            <li>Create anonymized proof points, benchmarks, and program materials</li>
            <li>Attributed marketing use of your results only with your prior written approval per Section 19</li>
          </ul>

          <h3>c. What We Do Not Do</h3>
          <p>
            We do not sell Member Data to third parties for monetary consideration. Aggregated, de-identified
            data may be shared with partners or prospective members without restriction, provided no individual
            Member or client is identifiable.
          </p>

          <h3>d. Your Client Data</h3>
          <p>
            You are solely responsible for obtaining any necessary consent from your own clients before
            submitting their data through any feature of the Services, even in anonymized form, and for complying
            with all applicable privacy, confidentiality, and data-protection laws. We are not liable for your
            failure to obtain consent or comply with such laws.
          </p>

          <h3>e. Data Security</h3>
          <p>
            We maintain reasonable administrative, technical, and physical safeguards designed to protect Member
            Data against unauthorized access, loss, or disclosure, including encryption in transit (TLS),
            encrypted storage, and access controls. However, no method of transmission or storage is 100% secure
            and we cannot guarantee absolute security.
          </p>

          <h3>f. Data Retention</h3>
          <p>
            Member Data is retained for the duration of the membership term and up to 24 months following
            termination, unless a longer period is required or permitted by applicable law, our legal
            obligations, or to enforce these Terms. Upon written request after the retention period, we will
            delete or anonymize your personal data, except where retention is required by law or the data has
            been incorporated into anonymized program IP.
          </p>

          <h3>g. Recordings</h3>
          <p>
            Group coaching calls, events, and Q&amp;A sessions may be recorded and made available to active
            members. By participating, you consent to being recorded in these sessions, including video, audio,
            screen share, and chat. If you do not consent, you must exit the session.
          </p>

          <h3>h. Your Data Rights</h3>
          <p>Subject to applicable law, you may:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request a copy of the data we hold about you</li>
            <li><strong>Correct:</strong> Request correction of inaccurate data</li>
            <li><strong>Delete:</strong> Request deletion, subject to legal retention requirements</li>
            <li><strong>Port:</strong> Request your data in a structured, commonly used format</li>
            <li><strong>Opt-Out:</strong> Withdraw from SMS, marketing email, or data collection at any time</li>
            <li><strong>Object:</strong> Object to certain uses of your data</li>
          </ul>
          <p>
            To exercise any of these rights, contact{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>
            . We will respond within 30 days (or as required by applicable law). See the{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            for additional rights under the CCPA/CPRA, GDPR, and other laws.
          </p>

          <h2>17. Member Responsibilities</h2>
          <p>
            You agree to engage with the program in good faith and to take responsibility for your own business
            outcomes. The program provides tools, frameworks, and community -- results depend on your effort,
            consistency, and execution.
          </p>

          <h3>Engagement</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Attend or watch recordings of group calls to stay current with program updates</li>
            <li>Review new curriculum modules within a reasonable time of release</li>
            <li>Participate in the community in a constructive and professional manner</li>
          </ul>

          <h3>Conduct</h3>
          <p>
            You agree to treat fellow community members, program staff, and program content with respect. We
            reserve the right to revoke membership without refund for conduct that is disruptive, harassing,
            abusive, or harmful to the community.
          </p>

          <h2>18. Prohibited Conduct</h2>
          <p>In connection with the Services, you will not (and will not attempt to, or assist any third party to):</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violate any applicable law, regulation, or third-party right, including intellectual-property and privacy rights</li>
            <li>Share, resell, sublicense, redistribute, publish, broadcast, screen-record, or otherwise make available any portion of the Content, curriculum, community access, recordings, or credentials to any non-Member</li>
            <li>Use the Services or Content to build, train, fine-tune, benchmark, or improve any competing program, community, product, or dataset, or to create a &ldquo;knock-off&rdquo; offering</li>
            <li>Use any data-mining, bot, scraper, crawler, or other automated means to access, collect, or extract data or Content from the Services, except as expressly permitted by us in writing</li>
            <li>Reverse engineer, decompile, disassemble, or attempt to derive source code or underlying ideas of any software provided through the Services, except to the extent expressly permitted by applicable law</li>
            <li>Circumvent, disable, or interfere with any security, authentication, rate-limiting, or access-control feature of the Services</li>
            <li>Upload or transmit viruses, malware, or any other harmful code</li>
            <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
            <li>Post or transmit content that is unlawful, defamatory, obscene, threatening, harassing, hateful, discriminatory, sexually explicit, or infringing</li>
            <li>Solicit, spam, market, or sell to other Members without our prior written consent</li>
            <li>Use the Services to provide services that are substantially similar to ours to third parties who would otherwise be our prospective customers</li>
            <li>Engage in any conduct that could damage, disable, overburden, or impair the Services</li>
          </ul>

          <h2>19. User-Generated Content</h2>
          <p>
            You retain ownership of Member Content you originally create. By submitting or making available any
            Member Content through the Services (including Win Reports, community posts, messages, comments,
            testimonials, and feedback), you grant to AI Operators Collective and Modern-Amenities, LLC a
            worldwide, irrevocable (for anonymized/aggregated uses), perpetual (for anonymized/aggregated uses),
            non-exclusive, royalty-free, fully paid-up, sublicensable, and transferable license to use, host,
            store, reproduce, modify, create derivative works from, publish, publicly display, publicly perform,
            distribute, analyze, aggregate, anonymize, and otherwise exploit such Member Content for any purpose
            related to the operation, marketing, improvement, and promotion of the Services and our business.
            Attributed use of your name, likeness, company name, logo, or identifiable results in marketing
            requires your prior written approval. Anonymized and aggregated use does not require approval and
            survives termination.
          </p>
          <p>
            You represent and warrant that you own or have all necessary rights, consents, and licenses to grant
            the license above, and that your Member Content does not and will not violate any law or third-party
            right. We may remove, refuse, or modify any Member Content at any time for any or no reason. We have
            no obligation to monitor Member Content and are not liable for any Member Content posted by you or
            any other user.
          </p>

          <h2>20. Copyright &amp; DMCA Takedown</h2>
          <p>
            We respect intellectual-property rights. If you believe content on the Services infringes your
            copyright, send a written notice under the U.S. Digital Millennium Copyright Act to our designated
            agent at{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>{" "}
            with: (i) a physical or electronic signature; (ii) identification of the copyrighted work claimed to
            be infringed; (iii) identification of the infringing material and its location; (iv) your contact
            information; (v) a good-faith statement that the use is not authorized; and (vi) a statement, under
            penalty of perjury, that the information is accurate and that you are authorized to act. We will
            respond to properly submitted notices, may remove or disable allegedly infringing material, and may
            terminate accounts of repeat infringers. Misrepresentations in a takedown notice may subject you to
            liability for damages under 17 U.S.C. &sect; 512(f).
          </p>

          <h2>21. Confidentiality</h2>
          <p>
            Each party will keep the other&rsquo;s nonpublic information confidential and use it solely for the
            purposes of these Terms. You agree not to share program materials, internal processes, playbooks,
            frameworks, templates, community content, pricing, or other confidential information with third
            parties outside your organization. Reasonable disclosures required by law are permitted.
          </p>

          <h2>22. Intellectual Property</h2>
          <p>
            All Services, Content, materials, frameworks, training content, software, tools, playbooks, Operator
            Blueprints, case-study systems, trademarks, service marks, logos, trade dress, benchmarks, analytics,
            and documentation (and all intellectual-property rights therein) are and remain the exclusive
            property of Modern-Amenities, LLC or its licensors. Subject to your compliance with these Terms, we
            grant you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access
            and use the Services and Content during your active membership solely for your internal use in
            operating your own AI advisory business. No resale, reposting, redistribution, or commercial
            exploitation of materials beyond your own bona-fide client engagements is permitted without prior
            written consent.
          </p>
          <p>
            All benchmarks, frameworks, analytics, and other derivative works created from aggregated Member Data
            and collective deployments are our exclusive property.
          </p>

          <h2>23. Non-Solicitation &amp; Non-Disparagement</h2>
          <p>
            For one (1) year following the end of your membership, you will not directly solicit for employment
            or engagement any of our employees, contractors, or coaches introduced through the program. You will
            not make defamatory or disparaging public statements about AI Operators Collective, Modern-Amenities,
            LLC, or its principals, employees, contractors, or members. Nothing herein restricts legally
            protected speech, whistleblower activity, good-faith reviews, or compliance with a lawful order.
          </p>

          <h2>24. Third-Party Services &amp; Links</h2>
          <p>
            The Services may reference, link to, integrate with, or display content from third-party websites,
            products, platforms, tools, payment processors, AI models, or services (&ldquo;<strong>Third-Party
            Services</strong>&rdquo;). Third-Party Services are not under our control. We do not endorse, and are
            not responsible for, any Third-Party Services, and are not liable for any loss or damage caused or
            alleged to be caused by use of any Third-Party Service. Your use of Third-Party Services is governed
            by their own terms and privacy policies.
          </p>

          <h2>25. Assumption of Risk; Security</h2>
          <p>
            You acknowledge that operating any business, including an AI advisory practice, involves risk,
            including financial, legal, regulatory, reputational, and operational risk. You assume all risk
            associated with your use of the Services and any decisions you make based on the Content. You are
            responsible for evaluating the accuracy, completeness, and usefulness of any Content and for
            independently verifying any claim, benchmark, tool output, or recommendation. AI outputs may be
            inaccurate, biased, or unsuitable for your specific use case; you must use human judgment.
          </p>

          <h2>26. Suspension &amp; Termination</h2>
          <p>
            We may suspend, restrict, or terminate your access to the Services, in whole or in part, at any
            time, with or without notice, for any reason or no reason, including (a) material or repeated breach
            of these Terms; (b) non-payment or chargebacks; (c) conduct we determine, in our sole discretion, to
            be abusive, harmful, unlawful, or inconsistent with the community; (d) suspected fraud or security
            risk; (e) a legal or regulatory obligation; or (f) discontinuance of the Services.
          </p>
          <p>
            Upon termination: (i) your license to access the Services and Content immediately ends; (ii) you must
            cease all use of the Content; (iii) you remain liable for all fees accrued prior to termination;
            (iv) any accrued fees are non-refundable except as expressly stated in Section 9; and (v) all
            provisions that by their nature should survive termination will survive, including Sections 2, 5, 11,
            12, 13, 14, 15(b), 16, 18&ndash;34, and any other obligation or restriction that contemplates
            continuing effect.
          </p>

          <h2>27. Referral Incentive</h2>
          <p>
            You may refer qualified professionals to AI Operators Collective. A &ldquo;Qualified Referral&rdquo;
            is a new member who (i) has not previously been a member of the program and (ii) pays in full for an
            annual membership within 30 days of sign-up, with the referral verifiably attributable to you based
            on our records.
          </p>
          <p>
            For each Qualified Referral, you will receive a credit equal to one (1) month of membership at your
            current tier, applied to the next renewal period. Credits are non-transferable, have no cash value,
            are not retroactive, and may be stacked to extend your term. We may deny or revoke credits for fraud,
            self-referrals, or abuse, and may modify or discontinue the referral program on written notice.
          </p>

          <h2>28. Disclaimers</h2>
          <p className="text-foreground font-semibold uppercase tracking-wide text-xs leading-relaxed">
            THE SERVICES AND ALL CONTENT ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
            WARRANTY OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WE EXPRESSLY DISCLAIM ALL
            WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING ALL IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, TITLE, ACCURACY, SYSTEM
            INTEGRATION, AND QUIET ENJOYMENT, AND ANY WARRANTIES ARISING FROM COURSE OF DEALING, COURSE OF
            PERFORMANCE, OR USAGE OF TRADE.
          </p>
          <p className="text-foreground font-semibold uppercase tracking-wide text-xs leading-relaxed">
            WE DO NOT WARRANT THAT (A) THE SERVICES WILL MEET YOUR REQUIREMENTS; (B) THE SERVICES WILL BE
            UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM VIRUSES OR MALICIOUS CODE; (C) ANY CONTENT, RESULT,
            OR INFORMATION OBTAINED THROUGH THE SERVICES WILL BE ACCURATE, COMPLETE, CURRENT, OR RELIABLE; OR
            (D) DEFECTS WILL BE CORRECTED. YOUR USE OF THE SERVICES IS AT YOUR SOLE RISK.
          </p>
          <p>
            Results vary and depend on your individual effort, market conditions, and other factors. All
            projections, benchmarks, and case-study outcomes are provided without warranty of any kind.
            Educational content is for informational purposes only and does not constitute business, legal, tax,
            financial, medical, or other professional advice.
          </p>
          <p>
            Some jurisdictions do not allow the exclusion of certain warranties; the above exclusions may not
            apply to you in full, in which case they apply to the maximum extent permitted by law.
          </p>

          <h2>29. Limitation of Liability</h2>
          <p className="text-foreground font-semibold uppercase tracking-wide text-xs leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL AI OPERATORS COLLECTIVE,
            MODERN-AMENITIES, LLC, OR ANY OF THEIR PARENTS, SUBSIDIARIES, AFFILIATES, OFFICERS, DIRECTORS,
            MANAGERS, MEMBERS, EMPLOYEES, CONTRACTORS, COACHES, AGENTS, LICENSORS, OR SUPPLIERS (COLLECTIVELY,
            THE &ldquo;COMPANY PARTIES&rdquo;) BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
            EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY LOST PROFITS, LOST REVENUE, LOST BUSINESS, LOST DATA, LOSS
            OF GOODWILL, BUSINESS INTERRUPTION, OR COST OF SUBSTITUTE SERVICES, ARISING OUT OF OR RELATED TO THE
            SERVICES, THE CONTENT, THESE TERMS, OR YOUR USE OF OR INABILITY TO USE THE SERVICES, REGARDLESS OF
            THE THEORY OF LIABILITY (CONTRACT, TORT, STRICT LIABILITY, STATUTE, OR OTHERWISE) AND EVEN IF WE HAVE
            BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
          <p className="text-foreground font-semibold uppercase tracking-wide text-xs leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE AGGREGATE LIABILITY OF THE COMPANY PARTIES TO YOU FOR
            ALL CLAIMS ARISING OUT OF OR RELATED TO THE SERVICES OR THESE TERMS WILL NOT EXCEED THE GREATER OF
            (A) THE TOTAL FEES YOU ACTUALLY PAID TO US FOR THE SERVICES IN THE SIX (6) MONTHS IMMEDIATELY
            PRECEDING THE EVENT GIVING RISE TO THE CLAIM; OR (B) ONE HUNDRED U.S. DOLLARS ($100). MULTIPLE
            CLAIMS DO NOT ENLARGE THIS LIMIT.
          </p>
          <p>
            The limitations in this Section 29 apply (i) regardless of whether any remedy fails of its essential
            purpose and (ii) to the maximum extent permitted by law. Some jurisdictions do not allow the
            exclusion or limitation of certain damages; in those jurisdictions, our liability is limited to the
            smallest extent permitted by law.
          </p>

          <h2>30. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless the Company Parties from and against any and all
            claims, demands, actions, suits, proceedings, investigations, liabilities, damages, losses,
            penalties, fines, judgments, settlements, costs, and expenses (including reasonable attorneys&rsquo;
            fees and court costs) arising out of or related to: (a) your access to or use of the Services;
            (b) your breach or alleged breach of these Terms; (c) your violation of any law or any third-party
            right, including intellectual-property, publicity, privacy, or confidentiality rights; (d) your
            Member Content; (e) any client engagement, business operation, contract, advertising claim,
            regulatory compliance decision, or tax or financial decision you make; (f) your negligence or willful
            misconduct; and (g) any dispute between you and a third party. We may assume the exclusive defense
            and control of any matter subject to indemnification, in which case you agree to cooperate with our
            defense. You may not settle any indemnified claim without our prior written consent.
          </p>

          <h2>31. Dispute Resolution; Binding Arbitration; Class-Action Waiver</h2>
          <p className="text-foreground font-semibold">Please read this Section carefully. It affects your legal rights.</p>

          <h3>a. Informal Resolution</h3>
          <p>
            Before initiating any arbitration or lawsuit, you agree to first send a written notice of dispute
            (&ldquo;<strong>Notice</strong>&rdquo;) to{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>{" "}
            describing the nature and basis of the claim and the specific relief sought. You and we will attempt
            in good faith to resolve the dispute informally for at least 60 days after delivery of the Notice
            before initiating any arbitration or legal proceeding.
          </p>

          <h3>b. Binding Individual Arbitration</h3>
          <p>
            If the dispute is not resolved informally, you and we agree that any claim, dispute, or controversy
            arising out of or relating to these Terms, the Services, or your relationship with us
            (&ldquo;<strong>Dispute</strong>&rdquo;) will be resolved exclusively by <strong>final and binding
            individual arbitration</strong> administered by the American Arbitration Association
            (&ldquo;<strong>AAA</strong>&rdquo;) under its Consumer Arbitration Rules (or Commercial Arbitration
            Rules if the consumer rules do not apply), as modified by these Terms. The Federal Arbitration Act
            governs the interpretation and enforcement of this Section. The arbitration will be conducted by a
            single neutral arbitrator. The seat of arbitration will be Lane County, Oregon; hearings may be
            telephonic or virtual at the arbitrator&rsquo;s discretion. Judgment on the award may be entered in
            any court of competent jurisdiction.
          </p>

          <h3>c. Class-Action &amp; Collective-Action Waiver</h3>
          <p className="text-foreground font-semibold uppercase tracking-wide text-xs leading-relaxed">
            YOU AND WE AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY
            AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, REPRESENTATIVE, MASS, OR
            PRIVATE-ATTORNEY-GENERAL PROCEEDING. THE ARBITRATOR MAY NOT CONSOLIDATE OR JOIN MORE THAN ONE
            PERSON&rsquo;S CLAIMS AND MAY NOT OTHERWISE PRESIDE OVER ANY FORM OF A REPRESENTATIVE OR CLASS
            PROCEEDING. THE ARBITRATOR MAY AWARD RELIEF ONLY TO THE INDIVIDUAL PARTY SEEKING RELIEF AND ONLY TO
            THE EXTENT NECESSARY TO PROVIDE RELIEF WARRANTED BY THAT PARTY&rsquo;S INDIVIDUAL CLAIM.
          </p>

          <h3>d. Jury-Trial Waiver</h3>
          <p className="text-foreground font-semibold uppercase tracking-wide text-xs leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, YOU AND WE KNOWINGLY AND VOLUNTARILY WAIVE ANY RIGHT TO A
            TRIAL BY JURY IN ANY ACTION, PROCEEDING, OR COUNTERCLAIM ARISING OUT OF OR RELATED TO THESE TERMS OR
            THE SERVICES.
          </p>

          <h3>e. Mass-Arbitration Coordination</h3>
          <p>
            If 25 or more similar arbitration demands are filed against us by or with the assistance of the same
            law firm or coordinated group within a 60-day period, the arbitrations will be administered in
            coordinated batches of no more than 50 demands at a time, and the parties will work with the AAA to
            implement a staged protocol to efficiently adjudicate the claims. Filing fees and arbitrator
            compensation will be allocated by the AAA in accordance with its rules.
          </p>

          <h3>f. 30-Day Opt-Out Right</h3>
          <p>
            You may opt out of this arbitration agreement and the class-action waiver by sending written notice
            to{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>{" "}
            within 30 days of first accepting these Terms. The notice must include your full legal name,
            address, email used for your account, and a clear statement that you are opting out of arbitration.
            If you properly opt out, neither you nor we will be bound by the arbitration or class-action-waiver
            provisions of this Section 31.
          </p>

          <h3>g. Exceptions</h3>
          <p>
            Notwithstanding the foregoing, either party may (i) bring an individual action in small-claims court
            for disputes within its jurisdiction, or (ii) seek injunctive or other equitable relief in a court of
            competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or
            violation of intellectual-property rights or confidentiality obligations.
          </p>

          <h3>h. Severability of this Section</h3>
          <p>
            If any portion of this Section 31 is found invalid or unenforceable, the remainder will remain in
            full force and effect, except that if the class-action waiver is found invalid or unenforceable with
            respect to any particular claim for relief, that claim (and only that claim) must be severed from
            the arbitration and litigated in court subject to Sections 32 and 33, while all other claims remain
            in arbitration.
          </p>

          <h2>32. Governing Law &amp; Venue</h2>
          <p>
            These Terms and any Dispute are governed by the laws of the State of Oregon, without regard to its
            conflict-of-law principles, and, where applicable, the Federal Arbitration Act. For any matter not
            subject to arbitration (or where either party opts out of arbitration under Section 31(f)), the
            exclusive venue is the state and federal courts located in Lane County, Oregon, and you and we each
            consent to the personal jurisdiction of those courts.
          </p>

          <h2>33. Limitation of Actions</h2>
          <p className="text-foreground font-semibold uppercase tracking-wide text-xs leading-relaxed">
            ANY CLAIM OR CAUSE OF ACTION ARISING OUT OF OR RELATED TO THE SERVICES OR THESE TERMS MUST BE FILED
            WITHIN ONE (1) YEAR AFTER THE CLAIM OR CAUSE OF ACTION AROSE, OR IT WILL BE FOREVER BARRED,
            REGARDLESS OF ANY LONGER STATUTE OF LIMITATIONS PROVIDED BY LAW.
          </p>

          <h2>34. Force Majeure</h2>
          <p>
            We will not be liable or responsible for any failure or delay in performance caused by circumstances
            beyond our reasonable control, including acts of God, flood, fire, earthquake, pandemic, epidemic,
            war, terrorism, civil unrest, labor disputes, governmental action, internet or utility failures,
            cyber-attacks, denial-of-service attacks, or third-party-service failures.
          </p>

          <h2>35. General Provisions</h2>

          <h3>a. Assignment</h3>
          <p>
            You may not assign, delegate, or transfer these Terms or any rights or obligations under them, in
            whole or in part, without our prior written consent. Any attempted assignment in violation of this
            section is void. We may freely assign these Terms, in whole or in part, to any affiliate, successor,
            or purchaser of our business or assets.
          </p>

          <h3>b. Entire Agreement</h3>
          <p>
            These Terms, the Privacy Policy, any applicable order form, and any additional terms expressly
            referenced constitute the entire agreement between you and us regarding the Services and supersede
            all prior or contemporaneous agreements, communications, proposals, and understandings (oral or
            written) on the subject matter.
          </p>

          <h3>c. Severability</h3>
          <p>
            If any provision of these Terms is held invalid, illegal, or unenforceable, that provision will be
            modified to the minimum extent necessary to be enforceable, and the remaining provisions will
            continue in full force and effect.
          </p>

          <h3>d. No Waiver</h3>
          <p>
            Our failure to enforce any provision of these Terms is not a waiver of our right to do so later. No
            waiver is effective unless in writing signed by us.
          </p>

          <h3>e. Notices</h3>
          <p>
            We may send you notices by email to the address on file, by posting on the Site, or by any
            reasonable means. Legal notices to us must be sent to{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>{" "}
            with a copy to Modern-Amenities, LLC, 8 The Green, Suite A, Dover, DE 19901.
          </p>

          <h3>f. Relationship of the Parties</h3>
          <p>
            The parties are independent contractors. Nothing in these Terms creates an agency, employment,
            partnership, franchise, joint venture, or fiduciary relationship between the parties.
          </p>

          <h3>g. Third-Party Beneficiaries</h3>
          <p>
            There are no third-party beneficiaries to these Terms, except that the Company Parties are intended
            third-party beneficiaries of Sections 28&ndash;31.
          </p>

          <h3>h. Headings; Interpretation</h3>
          <p>
            Section headings are for convenience only and do not affect interpretation. &ldquo;Including&rdquo;
            and &ldquo;include&rdquo; are non-exclusive and mean &ldquo;including without limitation.&rdquo;
          </p>

          <h3>i. Contra Proferentem</h3>
          <p>
            The rule of construction that ambiguities are resolved against the drafter does not apply to these
            Terms.
          </p>

          <h3>j. Survival</h3>
          <p>
            All provisions that by their nature should survive termination will survive, including Sections 2,
            5, 11, 12, 13, 14, 15(b), 16, 18&ndash;35.
          </p>

          <h2>36. Export Controls &amp; International Use</h2>
          <p>
            The Services are operated from the United States. You may not use or export the Services or Content
            in violation of U.S. export laws and regulations (including the Export Administration Regulations
            and sanctions administered by the U.S. Treasury&rsquo;s Office of Foreign Assets Control) or any
            other applicable export or sanctions laws. You represent that you are not a prohibited party. If
            you access the Services from outside the United States, you are responsible for compliance with
            local laws, and you consent to the transfer and processing of your data in the United States.
          </p>

          <h2>37. Accessibility</h2>
          <p>
            We strive to make the Services accessible to users of all abilities and are committed to ongoing
            improvement. If you have difficulty accessing any portion of the Services or need an accommodation,
            please contact{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>
            .
          </p>

          <h2>38. Changes to These Terms</h2>
          <p>
            We may revise these Terms from time to time in our sole discretion. We will post the updated version
            on the Site, update the &ldquo;Last Updated&rdquo; date, and, for material changes, may provide
            additional notice by email or in-app message. Continued use of the Services after changes take
            effect constitutes acceptance of the revised Terms. If you do not agree to any change, your sole
            remedy is to stop using the Services and cancel in accordance with Section 10.
          </p>

          <h2>39. Contact</h2>
          <p>For questions about these Terms or the Services:</p>
          <p>
            <strong>AI Operators Collective (Membership &amp; Support)</strong><br />
            Email:{" "}
            <a href="mailto:support@aioperatorcollective.com" className="text-primary hover:underline">
              support@aioperatorcollective.com
            </a>
          </p>
          <p>
            <strong>Modern-Amenities, LLC (Privacy, Legal &amp; Data Requests)</strong><br />
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
            Address: 8 The Green, Suite A, Dover, DE 19901
          </p>
        </div>
      </div>
    </section>
  )
}
