import { Link } from '@tanstack/react-router'

import { LegalLayout } from '#components/layout/legal-layout'
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_EFFECTIVE_DATE,
  PRODUCT_NAME
} from '#lib/legal-meta'

function TermsOfServicePage() {
  return (
    <LegalLayout title="Terms of Service">
      <p>
        <strong className="text-foreground">Effective date:</strong>{' '}
        {LEGAL_EFFECTIVE_DATE}
      </p>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of {PRODUCT_NAME} and related websites, APIs, and services
        (collectively, the &quot;Service&quot;). By accessing or using the
        Service, you agree to these Terms and our{' '}
        <Link
          to="/privacy"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>

      <section>
        <h2>1. The Service</h2>
        <p>
          {PRODUCT_NAME} is an AI meeting notetaker that connects to your Google
          account and, when you authorize it, your Google Calendar to identify
          video meetings and optionally join them with an automated assistant to
          record, transcribe, summarize, and help you review meeting content.
          Features may change over time; we may add, modify, or discontinue
          features with reasonable notice where practicable.
        </p>
      </section>

      <section>
        <h2>2. Eligibility and account</h2>
        <p>
          You must be at least 13 years old (or the minimum age in your
          jurisdiction) and able to form a binding contract. You are responsible
          for activity under your account and for keeping your credentials
          secure. You must provide accurate information and comply with
          applicable laws when using the Service.
        </p>
      </section>

      <section>
        <h2>3. Google and third-party services</h2>
        <p>
          The Service integrates with Google (sign-in and Calendar) and other
          third-party platforms and providers (for example video conferencing
          and infrastructure services). Your use of those services is subject to
          their terms and policies. We are not responsible for third-party
          services.
        </p>
      </section>

      <section>
        <h2>4. Recording and participant consent</h2>
        <p>
          Laws and workplace policies regarding recording meetings vary by
          location. You are solely responsible for obtaining any required
          consent from meeting participants before enabling recording or
          transcription, and for how you use or share meeting content. Do not
          use the Service to record meetings if you do not have the right to do
          so.
        </p>
      </section>

      <section>
        <h2>5. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>
            Use the Service for unlawful, harmful, fraudulent, or abusive
            purposes
          </li>
          <li>
            Interfere with or disrupt the Service, other users, or connected
            systems
          </li>
          <li>
            Attempt to access data or accounts that are not yours, or bypass
            security measures
          </li>
          <li>
            Reverse engineer or misuse the Service except where prohibited
            restrictions are not enforceable under applicable law
          </li>
          <li>
            Upload or process content that infringes intellectual property or
            privacy rights of others
          </li>
        </ul>
        <p>
          We may suspend or terminate access if we reasonably believe you have
          violated these Terms or pose a risk to the Service or others.
        </p>
      </section>

      <section>
        <h2>6. Your content</h2>
        <p>
          You retain ownership of content you provide or that is captured on
          your behalf (such as recordings, transcripts, and notes). You grant us
          a worldwide, non-exclusive license to host, process, transmit,
          display, and otherwise use your content solely to operate, provide,
          and improve the Service (including AI features you request), and as
          described in our Privacy Policy.
        </p>
      </section>

      <section>
        <h2>7. AI-generated output</h2>
        <p>
          Summaries, action items, and assistant responses may be inaccurate or
          incomplete. AI output is for assistance only and is not professional,
          legal, or financial advice. You are responsible for reviewing output
          before relying on it.
        </p>
      </section>

      <section>
        <h2>8. Intellectual property</h2>
        <p>
          We and our licensors own the Service, including software, branding,
          and documentation, except for your content. These Terms do not grant
          you any rights to our trademarks or service marks.
        </p>
      </section>

      <section>
        <h2>9. Disclaimer of warranties</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;
          WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR
          STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
          FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT
          THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT RECORDINGS OR
          TRANSCRIPTS WILL BE COMPLETE OR ACCURATE.
        </p>
      </section>

      <section>
        <h2>10. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE AND OUR AFFILIATES,
          OFFICERS, EMPLOYEES, AND SUPPLIERS WILL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
          ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE
          SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE IS
          LIMITED TO THE GREATER OF (A) AMOUNTS YOU PAID US FOR THE SERVICE IN
          THE TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS
          (US$100), EXCEPT WHERE LIABILITY CANNOT BE LIMITED BY LAW.
        </p>
      </section>

      <section>
        <h2>11. Indemnity</h2>
        <p>
          You will defend and indemnify us against claims, damages, and expenses
          (including reasonable attorneys&apos; fees) arising from your content,
          your use of the Service, or your violation of these Terms or
          applicable law, including claims related to recording meetings without
          required consent.
        </p>
      </section>

      <section>
        <h2>12. Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or
          terminate your access for any reason, including violation of these
          Terms. Provisions that by their nature should survive (including
          disclaimers, limitations of liability, and indemnity) will survive
          termination.
        </p>
      </section>

      <section>
        <h2>13. Governing law</h2>
        <p>
          These Terms are governed by the laws of the United States and the
          State of Delaware, without regard to conflict-of-law rules, except
          where mandatory consumer protection laws in your country of residence
          apply. Courts in Delaware will have exclusive jurisdiction for
          disputes arising from these Terms, except where prohibited by law.
        </p>
      </section>

      <section>
        <h2>14. Changes</h2>
        <p>
          We may modify these Terms by posting an updated version on this page
          and updating the effective date. Continued use after changes become
          effective constitutes acceptance. If you do not agree, you must stop
          using the Service.
        </p>
      </section>

      <section>
        <h2>15. Contact</h2>
        <p>
          Questions about these Terms:{' '}
          <a
            className="text-foreground underline-offset-4 hover:underline"
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  )
}

export { TermsOfServicePage }
