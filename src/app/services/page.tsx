// src/app/services/page.tsx
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import Link from "next/link";
import StructuredData, { generateServiceStructuredData, generateBreadcrumbStructuredData } from "@/components/StructuredData";

export const metadata = {
  title: "Services - Nomadic Performance",
  description: "Professional physical therapy and performance optimization services for outdoor athletes and adventurers. Virtual and in-person consultations available.",
};

export default function ServicesPage() {
  // Define services for structured data
  const services = [
    {
      name: "Virtual Consultations",
      description: "Remote physical therapy and coaching from anywhere. Includes initial assessments and follow-up sessions.",
      url: "https://nomadicperformance.com/services#virtual"
    },
    {
      name: "Injury Assessment & Treatment",
      description: "Comprehensive evaluation and treatment for acute injuries, chronic pain, and movement dysfunctions.",
      url: "https://nomadicperformance.com/services#in-person"
    },
    {
      name: "Performance Optimization",
      description: "Advanced training programs, movement analysis, and strength coaching for athletes and adventurers.",
      url: "https://nomadicperformance.com/services#in-person"
    },
    {
      name: "Specialized Programs",
      description: "Structured rehabilitation and return-to-activity programs for post-injury recovery with progressive loading and functional training.",
      url: "https://nomadicperformance.com/services#specialized"
    }
  ];

  // Generate structured data
  const serviceStructuredData = generateServiceStructuredData(services);
  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "Services", url: "/services" }
  ]);

  return (
    <main>
      <StructuredData data={serviceStructuredData} />
      <StructuredData data={breadcrumbStructuredData} />
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
            Services
          </h1>
          <p style={{
            fontSize: '1.4rem',
            opacity: 0.95,
            lineHeight: '1.6',
            marginBottom: '2rem',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            Evidence-based physical therapy and performance coaching for outdoor adventurers
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section style={{ padding: '5rem 5vw', background: '#f9f9f9' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Virtual Consultations */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '3rem',
            marginBottom: '3rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1.5rem',
                fontSize: '1.5rem'
              }}>
                💻
              </div>
              <div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1a3a2a', margin: 0 }}>
                  Virtual Consultations
                </h2>
                <p style={{ fontSize: '1.1rem', color: '#666', margin: '0.5rem 0 0 0' }}>
                  Remote physical therapy and coaching from anywhere
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
                  Initial Assessment
                </h3>
                <p style={{ lineHeight: '1.6', color: '#555', marginBottom: '1rem' }}>
                  Comprehensive evaluation of your movement patterns, injury history, and performance goals. We&apos;ll identify limitations and create a personalized plan.
                </p>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a' }}>
                  $150 (60 minutes)
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
                  Follow-up Sessions
                </h3>
                <p style={{ lineHeight: '1.6', color: '#555', marginBottom: '1rem' }}>
                  Progress check-ins, exercise modifications, and advanced training guidance to keep you moving forward.
                </p>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a' }}>
                  $100 (45 minutes)
                </div>
              </div>
            </div>
          </div>

          {/* In-Person Services */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '3rem',
            marginBottom: '3rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #2d5a3d 0%, #1a3a2a 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1.5rem',
                fontSize: '1.5rem'
              }}>
                🏔️
              </div>
              <div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1a3a2a', margin: 0 }}>
                  In-Person Services
                </h2>
                <p style={{ fontSize: '1.1rem', color: '#666', margin: '0.5rem 0 0 0' }}>
                  Hands-on physical therapy and performance coaching in Utah
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
                  Injury Assessment & Treatment
                </h3>
                <p style={{ lineHeight: '1.6', color: '#555', marginBottom: '1rem' }}>
                  Comprehensive evaluation and treatment for acute injuries, chronic pain, and movement dysfunctions.
                </p>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a' }}>
                  $125 (60 minutes)
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
                  Performance Optimization
                </h3>
                <p style={{ lineHeight: '1.6', color: '#555', marginBottom: '1rem' }}>
                  Advanced training programs, movement analysis, and strength coaching for athletes and adventurers.
                </p>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a' }}>
                  $125 (60 minutes)
                </div>
              </div>
            </div>
          </div>

          {/* Specialized Programs */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '3rem',
            marginBottom: '3rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #4a7c59 0%, #2d5a3d 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1.5rem',
                fontSize: '1.5rem'
              }}>
                🎯
              </div>
              <div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1a3a2a', margin: 0 }}>
                  Specialized Programs
                </h2>
                <p style={{ fontSize: '1.1rem', color: '#666', margin: '0.5rem 0 0 0' }}>
                  Targeted programs for specific needs and goals
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '2rem',
                borderLeft: '4px solid #1a3a2a'
              }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
                  Pre-Season Assessment & Training
                </h3>
                <p style={{ lineHeight: '1.6', color: '#555', marginBottom: '1.5rem' }}>
                  Comprehensive physical assessment and customized training program to prepare for your outdoor season. Includes movement screening, strength testing, and sport-specific conditioning.
                </p>
                <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1a3a2a' }}>
                  $250 (90 minutes)
                </div>
              </div>

              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '2rem',
                borderLeft: '4px solid #2d5a3d'
              }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
                  Return to Activity Program
                </h3>
                <p style={{ lineHeight: '1.6', color: '#555', marginBottom: '1.5rem' }}>
                  Structured rehabilitation and return-to-activity program for post-injury recovery. Includes progressive loading, functional movement training, and activity-specific preparation.
                </p>
                <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#1a3a2a' }}>
                  $400 (4 sessions)
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div style={{
            background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center',
            color: '#fff',
            boxShadow: '0 12px 40px rgba(26,58,42,0.3)'
          }}>
            <h2 style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              marginBottom: '1.5rem'
            }}>
              Ready to Get Started?
            </h2>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.7',
              opacity: 0.95,
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}>
              Whether you&apos;re recovering from an injury, preparing for your next adventure, or looking to optimize your performance, I&apos;m here to help you move better and feel stronger.
            </p>

            <Link href="/contact" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#fff',
              color: '#1a3a2a',
              padding: '1rem 2rem',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
              </svg>
              Schedule Consultation
            </Link>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
