import Link from "next/link";

export default function DmcaPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "48px 20px 72px", background: "#090a0d", color: "#f4f4f5" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <Link style={{ color: "#b8bbc4", textDecoration: "none", fontSize: 14 }} href="/">← Back to ReelRoom</Link>
        <p style={{ margin: "36px 0 10px", color: "#b9a0ff", fontSize: 12, fontWeight: 700, letterSpacing: ".16em" }}>REELROOM · LEGAL</p>
        <h1 style={{ margin: 0, fontSize: "clamp(32px, 6vw, 52px)", lineHeight: 1.08, letterSpacing: "-.04em" }}>DMCA &amp; Copyright Policy</h1>
        <p style={{ color: "#9ca0aa", fontSize: 13, margin: "14px 0 30px" }}>Last updated: October 29, 2026</p>

        <p style={paragraph}>ReelRoom respects intellectual property rights and expects visitors and contributors to do the same. This policy explains how to report content that you believe infringes your copyright.</p>

        <h2 style={heading}>Reporting alleged infringement</h2>
        <p style={paragraph}>If you are a copyright owner or authorized representative and believe material linked to or displayed on ReelRoom infringes your copyright, submit a written takedown notice to the site administrator through the contact channel provided by the website operator. Please include all of the following information so the report can be reviewed:</p>
        <ul style={{ paddingLeft: 22 }}>
          <li style={listItem}>Your physical or electronic signature.</li>
          <li style={listItem}>Identification of the copyrighted work you claim has been infringed.</li>
          <li style={listItem}>The specific URL(s) on ReelRoom that identify the material you want reviewed.</li>
          <li style={listItem}>Your contact information, including an email address.</li>
          <li style={listItem}>A statement that you have a good-faith belief the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
          <li style={listItem}>A statement that the information in your notice is accurate and, under penalty of perjury where applicable, that you are authorized to act for the owner of the exclusive right allegedly infringed.</li>
        </ul>

        <h2 style={heading}>Review and action</h2>
        <p style={paragraph}>We will review sufficiently detailed notices and may disable access to or remove identified material where appropriate. We may request additional information when a notice is incomplete or unclear. Submitting a notice does not guarantee removal, and knowingly submitting materially false claims may have legal consequences.</p>

        <h2 style={heading}>Counter-notifications</h2>
        <p style={paragraph}>If material you submitted or linked to was removed because of a copyright complaint and you believe the removal was a mistake or misidentification, contact the site administrator through the website&apos;s published contact channel and explain the basis for your request. Any formal counter-notification should include the information required by applicable law.</p>

        <h2 style={heading}>Repeat infringement</h2>
        <p style={paragraph}>Where appropriate and legally permitted, ReelRoom may restrict access for users who repeatedly submit or make available material that infringes intellectual property rights.</p>

        <h2 style={heading}>Important note</h2>
        <p style={paragraph}>This page provides general information and is not legal advice. It does not represent a claim that ReelRoom qualifies for any particular legal safe harbor. The operator should publish a monitored contact email or other reliable contact method so copyright notices can be delivered.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: 28, padding: "12px 18px", borderRadius: 999, background: "#f4f4f5", color: "#111217", textDecoration: "none", fontWeight: 700 }}>Return to ReelRoom</Link>
      </div>
    </main>
  );
}

const paragraph = { color: "#c9cbd2", fontSize: 16, lineHeight: 1.8 };
const heading = { margin: "32px 0 8px", fontSize: 21, letterSpacing: "-.02em" };
const listItem = { color: "#c9cbd2", fontSize: 16, lineHeight: 1.8, paddingLeft: 4, margin: "8px 0" };
