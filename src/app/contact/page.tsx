// src/app/contact/page.tsx
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
// import ContactForm from "../../components/ContactForm";
import ContactForm from "../../components/ContactForm";
import StructuredData, { generateContactPointStructuredData } from "../../components/StructuredData";

export const metadata = {
  title: "Contact Us - Nomadic Performance",
  description: "Get in touch with Nomadic Performance for physical therapy services, outdoor performance training, and health consultations in Utah.",
};

export default function ContactPage() {
  const contactPointData = generateContactPointStructuredData([
    {
      email: "contact@nomadicperformance.com",
      contactType: "customer service",
      areaServed: "Utah",
      availableLanguage: "English",
      hoursAvailable: "Monday-Friday 9:00-17:00"
    }
  ]);

  return (
    <main id="main-content">
      <StructuredData data={contactPointData} />
      <NavBar />

      {/* Hero Section */}
      <section style={{
        minHeight: '50vh',
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
            fontSize: '3.5rem',
            fontWeight: 900,
            marginBottom: '1.5rem',
            letterSpacing: '0.05em',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Get In Touch
          </h1>
          <p style={{
            fontSize: '1.4rem',
            opacity: 0.95,
            lineHeight: '1.6',
            marginBottom: '2rem',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            Ready to optimize your movement, prevent injuries, and perform at your best? Let&apos;s start the conversation.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section style={{ padding: '4rem 5vw', background: '#f9f9f9' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem', alignItems: 'start' }}>

            {/* Contact Form */}
            <div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
                Send Us a Message
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
                Whether you&apos;re interested in physical therapy services, have questions about outdoor performance training, or want to discuss your health goals, we&apos;re here to help.
              </p>
              <ContactForm />
            </div>

            {/* Contact Information */}
            <div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
                Contact Information
              </h2>

              {/* Email */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '0.5rem' }}>
                  ✉️ Email
                </h3>
                <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '0.5rem' }}>
                  <a href="mailto:joe@nomadicperformance.com" style={{ color: '#1a3a2a', textDecoration: 'none', fontWeight: 500 }}>
                    joe@nomadicperformance.com
                  </a>
                </p>
                <p style={{ fontSize: '0.9rem', color: '#888' }}>
                  We typically respond within 24 hours
                </p>
              </div>

              {/* Location */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '0.5rem' }}>
                  📍 Location
                </h3>
                <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '0.5rem' }}>
                  Serving Utah and surrounding areas
                </p>
                <p style={{ fontSize: '0.9rem', color: '#888' }}>
                  In-person and virtual consultations available
                </p>
              </div>

              {/* Social Media */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '0.5rem' }}>
                  🌐 Follow Us
                </h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <a
                    href="https://instagram.com/nomadicperformanceco"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      background: '#E4405F',
                      color: '#fff',
                      borderRadius: '50%',
                      textDecoration: 'none',
                      fontSize: '1.2rem',
                      transition: 'transform 0.2s'
                    }}
                    title="Follow us on Instagram"
                  >
                    📷
                  </a>
                  <a
                    href="https://twitter.com/NomadPerformCo"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      background: '#1DA1F2',
                      color: '#fff',
                      borderRadius: '50%',
                      textDecoration: 'none',
                      fontSize: '1.2rem',
                      transition: 'transform 0.2s'
                    }}
                    title="Follow us on Twitter"
                  >
                    🐦
                  </a>
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '0.5rem' }}>
                  🏥 Services
                </h3>
                <ul style={{ fontSize: '1rem', color: '#666', lineHeight: '1.6', paddingLeft: '1.2rem' }}>
                  <li>Physical Therapy & Rehabilitation</li>
                  <li>Performance Optimization</li>
                  <li>Injury Prevention & Assessment</li>
                  <li>Outdoor Athlete Training</li>
                  <li>Movement Analysis & Education</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
