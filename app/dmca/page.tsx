import Link from "next/link";

export default function DmcaPage() {
  return (
    <main className="dmca-page">
      <div className="dmca-shell">
        <Link className="dmca-back" href="/">← Back to ReelRoom</Link>
        <p className="dmca-kicker">REELROOM · LEGAL</p>
        <h1>DMCA & Copyright Policy</h1>
        <p className="dmca-updated">Last updated: October 29, 2026</p>

        <p>
          ReelRoom respects intellectual property rights and expects visitors and
          contributors to do the same. This policy explains how to report content
          that you believe infringes your copyright.
        </p>

        <h2>Reporting alleged infringement</h2>
        <p>
          If you are a copyright owner or authorized representative and believe
          material linked to or displayed on ReelRoom infringes your copyright,
          submit a written takedown notice to the site administrator through the
          contact channel provided by the website operator. Please include all of
          the following information so the report can be reviewed:
        </p>
        <ul>
          <li>Your physical or electronic signature.</li>
          <li>Identification of the copyrighted work you claim has been infringed.</li>
          <li>The specific URL(s) on ReelRoom that identify the material you want reviewed.</li>
          <li>Your contact information, including an email address.</li>
          <li>A statement that you have a good-faith belief the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
          <li>A statement that the information in your notice is accurate and, under penalty of perjury where applicable, that you are authorized to act for the owner of the exclusive right allegedly infringed.</li>
        </ul>

        <h2>Review and action</h2>
        <p>
          We will review sufficiently detailed notices and may disable access to
          or remove identified material where appropriate. We may request
          additional information when a notice is incomplete or unclear. Submitting
          a notice does not guarantee removal, and knowingly submitting materially
          false claims may have legal consequences.
        </p>

        <h2>Counter-notifications</h2>
        <p>
          If material you submitted or linked to was removed because of a
          copyright complaint and you believe the removal was a mistake or
          misidentification, contact the site administrator through the website's
          published contact channel and explain the basis for your request. Any
          formal counter-notification should include the information required by
          applicable law.
        </p>

        <h2>Repeat infringement</h2>
        <p>
          Where appropriate and legally permitted, ReelRoom may restrict access
          for users who repeatedly submit or make available material that
          infringes intellectual property rights.
        </p>

        <h2>Important note</h2>
        <p>
          This page provides general information and is not legal advice. It does
          not represent a claim that ReelRoom qualifies for any particular legal
          safe harbor. The operator should publish a monitored contact email or
          other reliable contact method so copyright notices can be delivered.
        </p>
        <Link className="dmca-home" href="/">Return to ReelRoom</Link>
      </div>
      <style jsx>{`
        .dmca-page { min-height: 100vh; padding: 48px 20px 72px; background: #090a0d; color: #f4f4f5; }
        .dmca-shell { max-width: 820px; margin: 0 auto; }
        .dmca-back { color: #b8bbc4; text-decoration: none; font-size: 14px; }
        .dmca-kicker { margin: 36px 0 10px; color: #b9a0ff; font-size: 12px; font-weight: 700; letter-spacing: .16em; }
        h1 { margin: 0; font-size: clamp(32px, 6vw, 52px); line-height: 1.08; letter-spacing: -.04em; }
        .dmca-updated { color: #9ca0aa; font-size: 13px; margin: 14px 0 30px; }
        p, li { color: #c9cbd2; font-size: 16px; line-height: 1.8; }
        h2 { margin: 32px 0 8px; font-size: 21px; letter-spacing: -.02em; }
        ul { padding-left: 22px; }
        li { padding-left: 4px; margin: 8px 0; }
        .dmca-home { display: inline-block; margin-top: 28px; padding: 12px 18px; border-radius: 999px; background: #f4f4f5; color: #111217; text-decoration: none; font-weight: 700; }
      `}</style>
    </main>
  );
}
