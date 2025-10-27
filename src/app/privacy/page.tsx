// src/app/privacy/page.tsx
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

export const metadata = {
  title: "Privacy Policy - Nomadic Performance",
  description: "Privacy policy for Nomadic Performance physical therapy services and blog.",
};

export default function PrivacyPage() {
  return (
    <main>
      <NavBar />

      {/* Hero Section */}
      <section style={{
        minHeight: '30vh',
        background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
        padding: '4rem 5vw'
      }}>
        <div style={{ maxWidth: '800px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            marginBottom: '1rem',
            letterSpacing: '0.05em',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Privacy Policy
          </h1>
          <p style={{
            fontSize: '1.2rem',
            opacity: 0.95,
            lineHeight: '1.6',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            How we protect and handle your personal information
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section style={{ padding: '4rem 5vw', background: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          <div style={{ marginBottom: '3rem' }}>
            <p style={{
              fontSize: '0.9rem',
              color: '#666',
              marginBottom: '2rem',
              fontStyle: 'italic'
            }}>
              Last updated: October 26, 2025
            </p>

            <div style={{ lineHeight: '1.7', color: '#333', fontSize: '1rem' }}>

              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginTop: '2rem',
                marginBottom: '1rem'
              }}>
                1. Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us, such as when you contact us through our website, subscribe to our newsletter, or request services. This may include your name, email address, phone number, and any other information you choose to provide.
              </p>

              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginTop: '2rem',
                marginBottom: '1rem'
              }}>
                2. How We Use Your Information
              </h2>
              <p>
                We use the information we collect to:
              </p>
              <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                <li>Respond to your inquiries and provide requested services</li>
                <li>Send you newsletters and blog updates (if you subscribe)</li>
                <li>Improve our website and services</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginTop: '2rem',
                marginBottom: '1rem'
              }}>
                3. Information Sharing
              </h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information only:
              </p>
              <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                <li>With service providers who help us operate our website and business</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>

              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginTop: '2rem',
                marginBottom: '1rem'
              }}>
                4. Data Security
              </h2>
              <p>
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>

              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginTop: '2rem',
                marginBottom: '1rem'
              }}>
                5. Cookies and Analytics
              </h2>
              <p>
                Our website may use cookies and similar technologies to enhance your experience and analyze website traffic. You can control cookie settings through your browser preferences.
              </p>

              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginTop: '2rem',
                marginBottom: '1rem'
              }}>
                6. Your Rights
              </h2>
              <p>
                You have the right to:
              </p>
              <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your personal information</li>
                <li>Opt out of marketing communications</li>
              </ul>

              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginTop: '2rem',
                marginBottom: '1rem'
              }}>
                7. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us at{' '}
                <a href="mailto:joe@nomadicperformance.com" style={{ color: '#1a3a2a', textDecoration: 'underline' }}>
                  joe@nomadicperformance.com
                </a>
              </p>

              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginTop: '2rem',
                marginBottom: '1rem'
              }}>
                8. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>

            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
