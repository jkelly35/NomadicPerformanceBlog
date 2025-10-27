import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

export default function AboutPage() {
  return (
    <main>
      <NavBar />
      <section style={{ minHeight: '80vh', padding: '4rem 5vw', background: '#f9f9f9', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#1a3a2a', marginBottom: '2rem' }}>
            About Nomadic Performance
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <img src="/images/NPLogo.png" alt="Nomadic Performance Logo" style={{ height: '150px', width: '150px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <p style={{ fontSize: '1.2rem', color: '#333', lineHeight: '1.6', marginBottom: '2rem' }}>
              Welcome to Nomadic Performance, your ultimate guide to outdoor adventure and fitness in Utah&apos;s stunning landscapes. Founded by passionate adventurers, we provide expert training, gear reviews, and inspirational stories to help you elevate your nomadic lifestyle.
            </p>
            <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: '1.6' }}>
              Whether you&apos;re an athlete, an adventurer, or simply someone who wants to feel better in your own body, this change means you can take control of your health, starting with movement.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
