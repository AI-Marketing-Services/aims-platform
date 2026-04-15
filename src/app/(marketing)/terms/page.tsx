import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | AI Operators Collective",
  description: "AI Operators Collective terms of service, membership agreement, and data policies.",
}

export default function TermsPage() {
  const lastUpdated = "April 15, 2026"

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
        <p className="text-sm text-muted-foreground mb-12">Last updated: {lastUpdated}</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_strong]:text-foreground [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2">

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing aioperatorscollective.com, purchasing a subscription or membership, participating in the AI
            Advisory Program, submitting data through the member reporting system, or opting in to receive SMS text
            messages, you (&ldquo;Member,&rdquo; &ldquo;Participant,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;)
            agree to these Terms of Service (&ldquo;Terms&rdquo;) and our Privacy Policy, incorporated herein by
            reference. If you represent an organization, you confirm that you have authority to bind that entity.
          </p>
          <p className="text-foreground font-semibold">
            IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THE SERVICES, DO NOT CHECK ANY ACCEPTANCE BOX, AND DO NOT SUBMIT ANY DATA.
          </p>

          <h2>2. Scope of Services</h2>
          <p>The Services include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Educational content, community access, curriculum modules, frameworks, playbooks, templates, and live coaching provided through the AI Advisory Program</li>
            <li>The AI Operators Collective member platform: a subscription-based training and advisory community designed to help members build, launch, and grow AI advisory practices serving local and mid-market businesses</li>
            <li>Member Win Reporting: a structured reporting system that allows members to document and submit client deployment results for use in benchmarking, curriculum development, and community proof-point generation</li>
            <li>SMS text messaging communications including community updates, event reminders, promotional offers, account notifications, and member support</li>
          </ul>

          <h2>3. Eligibility and Account Security</h2>
          <p>
            You must be at least 18 years old and provide accurate information when creating an account, making a
            purchase, submitting data, or subscribing to SMS communications. You are responsible for maintaining
            the confidentiality of your login credentials and all activity under your account.
          </p>

          <h2>4. SMS Text Messaging Program Terms</h2>

          <h3>a. Program Description</h3>
          <p>
            SMS communications may include community updates, event reminders, promotional offers, account
            notifications, and support messages.
          </p>

          <h3>b. Opt-In Consent</h3>
          <p>
            By providing your mobile phone number, checking an opt-in box, texting a keyword, or verbally
            consenting, you agree to receive recurring automated messages. Consent is not required to purchase
            products or services.
          </p>

          <h3>c. Message Frequency</h3>
          <p>Message frequency varies and may include multiple messages per week.</p>

          <h3>d. Opt-Out</h3>
          <p>You may cancel SMS service at any time by texting STOP. A confirmation message will follow.</p>

          <h3>e. Help</h3>
          <p>
            Reply HELP or contact{" "}
            <a href="mailto:support@aioperatorscollective.com" className="text-primary hover:underline">
              support@aioperatorscollective.com
            </a>{" "}
            for assistance.
          </p>

          <h3>f. Carrier Liability</h3>
          <p>Carriers are not liable for delayed or undelivered messages.</p>

          <h3>g. Message and Data Rates</h3>
          <p>Message and data rates may apply.</p>

          <h3>h. Privacy</h3>
          <p>For privacy-related inquiries, please refer to our Privacy Policy.</p>

          <h2>5. Membership Fees and Payments</h2>
          <p>
            All fees for subscriptions, memberships, and digital products are stated at the time of purchase.
            Subscription memberships will automatically renew at the end of each billing period unless canceled prior
            to renewal. Fees are non-refundable except as required by law or expressly stated in the applicable offer
            terms. Late payments on payment plans may result in suspension of access until the account is current.
          </p>
          <p>Current subscription tiers are as follows:</p>

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
            aioperatorscollective.com. Changes to pricing will not affect active annual memberships during the
            current term.
          </p>

          <h2>6. Refund Policy</h2>

          <h3>Annual Members</h3>
          <p>
            AI Operators Collective offers a 30-day refund window for annual memberships. Member may request a
            full refund within 30 days of the Effective Date if they determine the program is not a fit. After 30 days,
            annual fees are non-refundable.
          </p>
          <p>
            To request a refund, Member must email{" "}
            <a href="mailto:support@aioperatorscollective.com" className="text-primary hover:underline">
              support@aioperatorscollective.com
            </a>{" "}
            within the 30-day window. Refunds, if approved, are processed within 15 business days.
          </p>

          <h3>Month-to-Month Members</h3>
          <p>Monthly fees are non-refundable for any month in which access has been provided.</p>

          <h3>Clarifications</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>This is a training and community membership program, not a franchise, business opportunity, or guaranteed income program</li>
            <li>Results depend on Member&rsquo;s effort, market conditions, and individual execution</li>
            <li>AI Operators Collective does not guarantee specific revenue, client acquisition, or business outcomes</li>
          </ul>

          <h2>7. Cancellation</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Annual memberships may not be cancelled mid-term except as provided in Section 6. No pro-rated refunds are issued for unused months.</li>
            <li>Month-to-month memberships may be cancelled with 30 days written notice to <a href="mailto:support@aioperatorscollective.com" className="text-primary hover:underline">support@aioperatorscollective.com</a>. Cancellation takes effect at the end of the then-current billing period. No partial-month refunds.</li>
            <li>Upon cancellation or non-renewal, Member&rsquo;s access to all program materials, community, and resources is terminated.</li>
          </ul>

          <h2>8. Earnings and Results Disclaimer</h2>
          <p>
            AI Operators Collective does not and cannot guarantee specific revenue, client acquisition, income, or
            business outcomes. Examples of results shared in the program, including member win reports and case
            studies, are illustrative only. Member&rsquo;s results will vary based on effort, market, execution, experience,
            and other factors outside AI Operators Collective&rsquo;s control. This program does not constitute legal, tax, or
            financial advice.
          </p>

          <h2>9. Data Submission -- Member Win Reporting</h2>

          <h3>a. Data You Provide</h3>
          <p>
            As a Member, you may voluntarily submit win reports through the standardized member reporting
            template. Data submitted may include:
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
            You represent and warrant that: (a) you have the legal authority to provide all submitted data; (b) all data
            submitted is accurate and complete to the best of your knowledge; (c) your submission does not violate
            any third-party rights or applicable laws; and (d) you have obtained any necessary consent from your own
            clients before including client information in any submission.
          </p>

          <h2>10. Data Collection, Privacy, and Use</h2>

          <h3>a. What Data AI Operators Collective Collects</h3>
          <p>In the course of delivering the program, AI Operators Collective may collect:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Member profile data: Name, contact information, professional background</li>
            <li>Engagement data: Call attendance, module activity, and community participation</li>
            <li>Member Win Report data: Business type, problem, solution deployed, and outcomes submitted voluntarily through the member win reporting process</li>
            <li>Client-adjacent data: Anonymized or aggregated information about Member&rsquo;s clients that Member chooses to include in win reports</li>
          </ul>

          <h3>b. How Data Is Used</h3>
          <p>AI Operators Collective uses collected data to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Deliver and improve program curriculum and tools</li>
            <li>Generate aggregate insights across the collective to improve Operator IP</li>
            <li>Create anonymized proof points and program materials</li>
            <li>Support attributed marketing use of Member&rsquo;s results, with prior written approval per Section 11</li>
          </ul>

          <h3>c. What We Do Not Do</h3>
          <p>
            AI Operators Collective does not sell Member data to third parties. Aggregated, de-identified data may be
            shared with partners or prospective members without restriction, provided no individual Member or client
            is identifiable.
          </p>

          <h3>d. Member&rsquo;s Client Data</h3>
          <p>
            Member is responsible for obtaining any necessary consent from their own clients before submitting client
            data, even anonymized, through the win report process. Member represents and warrants that any
            client data submitted has been collected and shared in compliance with applicable privacy laws and any
            confidentiality obligations Member holds. AI Operators Collective is not liable for Member&rsquo;s failure to
            obtain proper consent.
          </p>

          <h3>e. Data Security</h3>
          <p>
            AI Operators Collective will maintain reasonable safeguards to protect Member data against unauthorized
            access, loss, or disclosure, including encryption in transit (TLS), encrypted storage, and access controls.
            However, no method of transmission or storage is 100% secure.
          </p>

          <h3>f. Data Retention</h3>
          <p>
            Member data is retained for the duration of the membership term and up to 24 months following
            termination. Upon written request after the retention period, AI Operators Collective will delete or
            anonymize Member&rsquo;s personal data, except where retention is required by law or where data has been
            incorporated into anonymized program IP.
          </p>

          <h3>g. Recordings</h3>
          <p>
            Group coaching calls and Q&amp;A sessions may be recorded and made available to active members. By
            participating, Member consents to being recorded in these sessions.
          </p>

          <h2>11. Member Win Reports and Case Study Participation</h2>
          <p>
            Members are encouraged to submit win reports using the standardized reporting template when they
            achieve client results. Submission of win reports is part of the collective culture and, for Accelerator and
            Inner Circle members, is an expected component of program participation.
          </p>
          <p>
            Submitted win reports may be used by AI Operators Collective in anonymized or attributed form for
            marketing, proof of concept, and curriculum development, subject to Member&rsquo;s prior written approval for
            any attributed use. Member is responsible for obtaining any necessary consent from their own clients
            before including client information in any submission.
          </p>

          <h2>12. Member Responsibilities</h2>
          <p>
            Member agrees to engage with the program in good faith and takes responsibility for their own business
            outcomes. The program provides tools, frameworks, and community -- results depend on Member&rsquo;s effort,
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
            Member agrees to treat fellow community members, program staff, and program content with respect. AI
            Operators Collective reserves the right to revoke membership without refund for conduct that is disruptive,
            abusive, or harmful to the community.
          </p>

          <h2>13. Confidentiality</h2>
          <p>
            Each Party will keep the other&rsquo;s nonpublic information confidential and use it solely for the purposes of
            this Agreement. Member agrees not to share program materials, internal processes, playbooks,
            frameworks, templates, community content, or pricing with third parties outside Member&rsquo;s organization.
            Reasonable disclosures required by law are permitted.
          </p>

          <h2>14. Intellectual Property</h2>
          <p>
            All materials, frameworks, training content, tools, playbooks, Operator Blueprints, and case study systems
            provided by AI Operators Collective are and remain the sole property of Modern-Amenities, LLC. Member
            receives a non-exclusive, non-transferable license to use materials internally for Member&rsquo;s AI advisory
            business during and after the membership term. No resale, reposting, redistribution, or commercial use of
            materials beyond Member&rsquo;s own client engagements is permitted without prior written consent.
          </p>
          <p>
            All benchmarks, frameworks, analytics, and other derivative works created from aggregated member data
            and collective deployments are the exclusive property of Modern-Amenities, LLC.
          </p>
          <p>
            Member retains all ownership rights in data and content they originally create. By submitting win reports
            or community content, Member grants Modern-Amenities, LLC a worldwide, non-exclusive, royalty-free
            license to use, process, analyze, aggregate, and anonymize such data for the purposes described in
            these Terms. This license continues after membership ends, but only for data that has been anonymized
            and aggregated in a manner that cannot identify Member.
          </p>

          <h2>15. Non-Solicitation and Non-Disparagement</h2>
          <p>
            For one (1) year following the end of the membership term, Member will not directly solicit for employment
            any of AI Operators Collective&rsquo;s employees, contractors, or coaches introduced through the program.
          </p>
          <p>
            Member will not make defamatory or disparaging public statements about AI Operators Collective or its
            principals. Nothing herein restricts legally protected speech or compliance with a lawful order.
          </p>

          <h2>16. Disclaimers</h2>
          <p>
            The Services are provided &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE.&rdquo; Educational content is for informational
            purposes only and does not constitute business, legal, or financial advice. AI Operators Collective makes
            no guarantees regarding the accuracy of any projections, the success of any business decisions based
            on program insights, or the ongoing availability of specific features or content.
          </p>
          <p>
            Results vary and depend on individual effort, market conditions, and other factors. All projections,
            benchmarks, and case study outcomes are provided without warranty of any kind. To the fullest extent
            permitted by law, we disclaim all implied warranties, including merchantability, fitness for a particular
            purpose, and non-infringement.
          </p>
          <p>
            You acknowledge that all business decisions remain your sole responsibility. The program provides
            informational tools only and does not constitute business, financial, or legal advice.
          </p>

          <h2>17. Limitation of Liability; Indemnity</h2>
          <p className="text-foreground font-semibold text-xs uppercase tracking-wide leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, AI OPERATORS COLLECTIVE, MODERN-AMENITIES, LLC,
            AND THEIR AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
            OR PUNITIVE DAMAGES, OR FOR LOST PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR
            INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING FROM OR
            RELATED TO: (A) YOUR USE OR INABILITY TO USE THE SERVICES (INCLUDING SMS COMMUNICATIONS);
            (B) ANY UNAUTHORIZED ACCESS TO OR USE OF YOUR DATA; (C) ANY BUSINESS DECISIONS MADE BASED
            ON PROGRAM CONTENT OR INSIGHTS; OR (D) ANY OTHER MATTER RELATING TO THE SERVICES.
          </p>
          <p>
            Our aggregate liability under these Terms will not exceed the total fees you paid to us in the 12 months
            preceding the claim.
          </p>
          <p>
            Member agrees to defend, indemnify, and hold harmless AI Operators Collective, Modern-Amenities,
            LLC, and their affiliates from any claims, damages, or expenses (including reasonable attorneys&rsquo; fees)
            arising out of Member&rsquo;s client engagements, business operations, contracts, regulatory compliance
            decisions, misuse of the Services, violation of these Terms, or infringement of any third-party rights.
          </p>

          <h2>18. Relationship of the Parties</h2>
          <p>
            The Parties are independent contractors. Nothing in these Terms creates an agency, employment
            relationship, partnership, franchise, or joint venture between the Parties.
          </p>

          <h2>19. Referral Incentive</h2>
          <p>
            Member may refer qualified professionals to AI Operators Collective. A &ldquo;Qualified Referral&rdquo; is a new
            member who (i) has not previously been a member of the program and (ii) pays in full for an annual
            membership within 30 days of sign-up, with the referral verifiably attributable to Member based on AI
            Operators Collective&rsquo;s records.
          </p>
          <p>
            For each Qualified Referral, Member will receive a credit equal to one (1) month of membership at
            Member&rsquo;s current tier, applied to the next renewal period. Credits are non-transferable, have no cash
            value, are not retroactive, and may be stacked to extend Member&rsquo;s term. AI Operators Collective may
            deny or revoke credits for fraud, self-referrals, or abuse, and may modify or discontinue the referral
            program on written notice.
          </p>

          <h2>20. Termination</h2>
          <p>
            AI Operators Collective reserves the right to suspend or terminate your access to the Services for
            material breach of these Terms, including but not limited to unauthorized sharing of content, abusive
            behavior toward staff or members, or failure to pay fees. Upon termination, you will lose access to all
            program materials, community resources, and collective benefits.
          </p>
          <p>
            Anonymized data incorporated into aggregated program IP may remain after termination.
          </p>

          <h2>21. Your Data Rights</h2>
          <p>You have the following rights regarding your data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request a copy of the data we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
            <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
            <li><strong>Portability:</strong> Request your data in a structured, commonly used format</li>
            <li><strong>Opt-Out:</strong> Withdraw from SMS communications or data collection at any time</li>
            <li><strong>Object:</strong> Object to certain uses of your data</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:privacy@modern-amenities.com" className="text-primary hover:underline">
              privacy@modern-amenities.com
            </a>
            . We will respond to your request within 30 days.
          </p>

          <h2>22. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms are governed by the laws of the State of Oregon, without regard to conflict-of-law principles.
            Any dispute not resolved informally will be settled by binding arbitration conducted under the Commercial
            Arbitration Rules of the American Arbitration Association, with arbitration to occur in Eugene, Oregon.
            Either party may seek injunctive relief in court to protect intellectual property rights or confidential
            information. Judgment on any award may be entered in any court of competent jurisdiction.
          </p>

          <h2>23. Changes to Terms</h2>
          <p>
            We may revise these Terms from time to time. We will post the updated version on our website, update
            the &ldquo;Last Updated&rdquo; date, and may provide notice of material changes by email. Continued use of the
            Services after changes take effect constitutes acceptance. If you do not agree to modifications, you may
            terminate your participation.
          </p>

          <h2>24. Contact</h2>
          <p>For questions about these Terms or the Services:</p>
          <p>
            <strong>AI Operators Collective (Membership Services)</strong><br />
            Email:{" "}
            <a href="mailto:support@aioperatorscollective.com" className="text-primary hover:underline">
              support@aioperatorscollective.com
            </a>
          </p>
          <p>
            <strong>Modern-Amenities, LLC (Privacy &amp; Data Requests)</strong><br />
            Email:{" "}
            <a href="mailto:privacy@modern-amenities.com" className="text-primary hover:underline">
              privacy@modern-amenities.com
            </a><br />
            Address: 8 The Green, Suite A, Dover, DE 19901
          </p>
        </div>
      </div>
    </section>
  )
}
