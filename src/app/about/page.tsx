import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import Link from "next/link";

export const metadata = {
  title: "About Me - Nomadic Performance",
  description: "Learn about Joe, a Doctor of Physical Therapy and CSCS who founded Nomadic Performance to help outdoor adventurers optimize their health and performance.",
};

export default function AboutPage() {
  return (
    <main>
      <NavBar />

      {/* Hero Section with Background Image */}
      <section style={{
        minHeight: '60vh',
        background: 'linear-gradient(135deg, rgba(26,58,42,0.85) 0%, rgba(45,90,61,0.85) 100%), url("/images/MTNme.jpeg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
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
            Meet Joe
          </h1>
          <p style={{
            fontSize: '1.4rem',
            opacity: 0.95,
            lineHeight: '1.6',
            marginBottom: '2rem',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            Doctor of Physical Therapy • Certified Strength & Conditioning Specialist • Outdoor Enthusiast
          </p>
          <div style={{
            width: '100px',
            height: '4px',
            background: '#fff',
            margin: '0 auto',
            borderRadius: '2px'
          }}></div>
        </div>
      </section>

      {/* Main Content Section */}
      <section style={{ padding: '5rem 5vw', background: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* Introduction Card */}
          <div style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '16px',
            padding: '3rem',
            marginBottom: '3rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', lineHeight: '1.7', fontSize: '1.1rem', color: '#333' }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 500 }}>
                Hi, I&apos;m Joe — a Doctor of Physical Therapy (Boston University, 2020) and Certified Strength and Conditioning Specialist (CSCS). My passion for movement goes far beyond the clinic. After years working in orthopedic and sports performance settings, I realized that health and fitness shouldn&apos;t be confined to four walls — especially for those of us who live for the outdoors.
              </p>
            </div>
          </div>

          {/* Mission Section */}
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: '#1a3a2a',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              The Vision Behind Nomadic Performance
            </h2>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '2rem',
                borderLeft: '4px solid #1a3a2a'
              }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
                  Bridging Rehabilitation & Adventure
                </h3>
                <p style={{ lineHeight: '1.6', color: '#555' }}>
                  I started <strong>Nomadic Performance</strong> with a mission to help athletes, adventurers, and everyday movers take control of their health, optimize performance, and stay injury‑free wherever the trail leads. My goal is to bridge the gap between rehabilitation and real‑world adventure — blending evidence‑based training with the freedom of the outdoor lifestyle.
                </p>
              </div>

              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '2rem',
                borderLeft: '4px solid #2d5a3d'
              }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
                  From Clinic to Mountains
                </h3>
                <p style={{ lineHeight: '1.6', color: '#555' }}>
                  Through this blog, I share insights from clinical practice and days spent in the mountains — topics on injury prevention, mobility, recovery, and performance to help you move better, feel stronger, and stay ready for whatever&apos;s next.
                </p>
              </div>
            </div>
          </div>

          {/* Current & Future Vision */}
          <div style={{ marginBottom: '4rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
              borderRadius: '16px',
              padding: '3rem',
              color: '#fff',
              textAlign: 'center',
              boxShadow: '0 12px 40px rgba(26,58,42,0.3)'
            }}>
              <h2 style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                marginBottom: '1.5rem'
              }}>
                Building a Global Movement Community
              </h2>
              <p style={{
                fontSize: '1.1rem',
                lineHeight: '1.7',
                opacity: 0.95,
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                For now, Nomadic Performance is just a blog — a place where I share what I know and help others stay strong, healthy, and ready for adventure. But my long‑term vision is to grow this into something much bigger: a remote platform where I can connect with athletes and adventurers across the world, offering evidence‑based training and physical therapy guidance wherever they roam.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: '16px',
            padding: '3rem',
            textAlign: 'center',
            border: '2px solid #e9ecef'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#1a3a2a',
              marginBottom: '1.5rem'
            }}>
              Let&apos;s Connect
            </h2>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              color: '#555',
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}>
              Every reader, follower, and shared story helps build that vision — a community of movement‑minded individuals who believe that adventure is the best medicine. If you have questions, want to connect, or would like to see something specific covered here, please reach out or connect with me on social media.
            </p>

            <Link href="/contact" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#1a3a2a',
              color: '#fff',
              padding: '1rem 2rem',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
            className="cta-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
              </svg>
              Get In Touch
            </Link>
          </div>

          {/* Personal Note */}
          <div style={{
            marginTop: '3rem',
            padding: '2rem',
            background: 'linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%)',
            borderRadius: '12px',
            border: '1px solid #ffe082',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '1.1rem',
              fontStyle: 'italic',
              color: '#5d4037',
              lineHeight: '1.6',
              margin: 0
            }}>
              When I&apos;m not writing or coaching, you&apos;ll find me somewhere in the wild — snowboarding, mountain biking, climbing, or chasing the next summit.
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
