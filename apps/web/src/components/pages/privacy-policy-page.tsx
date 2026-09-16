import { LegalLayout } from '#components/layout/legal-layout'
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_EFFECTIVE_DATE,
  PRODUCT_NAME
} from '#lib/legal-meta'

function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        <strong className="text-foreground">Effective date:</strong>{' '}
        {LEGAL_EFFECTIVE_DATE}
      </p>
      <p>
        This Privacy Policy describes how {PRODUCT_NAME} (&quot;we,&quot;
        &quot;us,&quot; or &quot;our&quot;) collects, uses, and shares
        information when you use our AI meeting notetaker web application and
        related services (the &quot;Service&quot;). By using the Service, you
        agree to this policy.
      </p>

      <section>
        <h2>1. Information we collect</h2>
        <h3>Account and authentication</h3>
        <p>
          When you sign in with Google, we receive information from your Google
          account that Better Auth and our API need to operate the Service, such
          as your name, email address, and Google account identifier. We store
          session data in cookies or similar technologies so you can stay signed
          in.
        </p>
        <h3>Google Calendar</h3>
        <p>
          If you connect Google Calendar, we access calendar events using the{' '}
          <code className="text-foreground">calendar.events.readonly</code>{' '}
          scope. We use this to find meetings that include a video conference
          link (for example Google Meet, Zoom, or Microsoft Teams), sync event
          titles and start/end times, and schedule recording assistants. We do
          not use Calendar data to serve advertising.
        </p>
        <h3>Meeting capture and content</h3>
        <p>
          When you use the Service for a meeting, our recording assistant may
          join the call on your behalf (as configured from your calendar). We
          process and store meeting-related content such as audio/video
          recordings, transcripts, participant names, in-meeting chat messages
          (when available from the conferencing platform), and metadata about
          the call (for example duration and processing status).
        </p>
        <h3>Content you create in the app</h3>
        <p>
          We store highlights, scratchpad notes, action items, summaries, and
          messages you send to our in-app meeting assistant, including
          embeddings derived from transcript text to power question-and-answer
          features.
        </p>
        <h3>Technical and usage data</h3>
        <p>
          We may collect standard server logs (such as IP address, request time,
          and browser type) to secure and operate the Service.
        </p>
      </section>

      <section>
        <h2>2. How we use information</h2>
        <p>We use the information above to:</p>
        <ul>
          <li>Authenticate you and maintain your account and sessions</li>
          <li>Sync calendar events and dispatch recording assistants</li>
          <li>
            Store, play back, and share meeting recordings and transcripts
          </li>
          <li>
            Generate summaries, action items, and other AI-assisted insights
          </li>
          <li>Provide search and Q&amp;A over your meeting content</li>
          <li>Improve reliability, security, and support for the Service</li>
          <li>Comply with law and enforce our Terms of Service</li>
        </ul>
      </section>

      <section>
        <h2>3. Google API Services Limited Use</h2>
        <p>
          {PRODUCT_NAME}&apos;s use of information received from Google APIs
          adheres to the{' '}
          <a
            className="text-foreground underline-offset-4 hover:underline"
            href="https://developers.google.com/terms/api-services-user-data-policy"
            rel="noopener noreferrer"
            target="_blank"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. In particular:
        </p>
        <ul>
          <li>
            We use Google user data only to provide or improve user-facing
            features of the Service (for example sign-in and calendar-based
            meeting scheduling).
          </li>
          <li>
            We do not use Google user data for serving advertisements, including
            retargeting, personalized, or interest-based advertising.
          </li>
          <li>
            We do not sell Google user data. We do not allow humans to read
            Google user data except with your affirmative agreement, for
            security or legal compliance, or in aggregated form for internal
            operations.
          </li>
          <li>
            We do not transfer Google user data to third parties except as
            described in this policy (service providers that process data on our
            behalf under contract), or with your consent, or for legal reasons.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. How we share information</h2>
        <p>We may share information with:</p>
        <ul>
          <li>
            <strong className="text-foreground">Service providers</strong> that
            help us run the Service, such as cloud hosting, object storage,
            meeting-bot and transcription providers, and AI model providers.
            These parties process data only to perform services for us under
            appropriate safeguards.
          </li>
          <li>
            <strong className="text-foreground">
              Other meeting participants
            </strong>{' '}
            when you use share links or features that make content available to
            others. You control when sharing is enabled.
          </li>
          <li>
            <strong className="text-foreground">Legal and safety</strong> when
            we believe disclosure is required by law or necessary to protect
            rights, safety, and security.
          </li>
          <li>
            <strong className="text-foreground">Business transfers</strong> in
            connection with a merger, acquisition, or sale of assets, subject to
            this policy.
          </li>
        </ul>
        <p>We do not sell your personal information.</p>
      </section>

      <section>
        <h2>5. Data retention</h2>
        <p>
          We retain information for as long as your account is active or as
          needed to provide the Service, unless a longer period is required by
          law. Meeting artifacts and derived content are kept until you delete
          them or your account, or as described in product settings we may
          provide. You may request deletion by contacting us.
        </p>
      </section>

      <section>
        <h2>6. Security</h2>
        <p>
          We use administrative, technical, and organizational measures designed
          to protect information. No method of transmission or storage is
          completely secure; we cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>7. Your choices and rights</h2>
        <ul>
          <li>
            You can disconnect Google Calendar by revoking access in your Google
            Account security settings and within the Service where available.
          </li>
          <li>
            You can sign out to end your session. To remove Google sign-in
            access, revoke the app in your Google Account.
          </li>
          <li>
            Depending on where you live, you may have rights to access, correct,
            delete, or export personal data, or to object to certain processing.
            Contact us to exercise these rights.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Children</h2>
        <p>
          The Service is not directed to children under 13 (or the minimum age
          required in your country). We do not knowingly collect personal
          information from children.
        </p>
      </section>

      <section>
        <h2>9. International transfers</h2>
        <p>
          We may process and store information in countries other than where you
          live. We take steps designed to ensure appropriate protections when
          data is transferred internationally.
        </p>
      </section>

      <section>
        <h2>10. Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the
          updated policy on this page and revise the effective date above.
          Material changes may be communicated through the Service or by email
          where appropriate.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p>
          For privacy questions or requests, email us at{' '}
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

export { PrivacyPolicyPage }
