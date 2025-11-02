// src/app/page.tsx
import NavBar from "../components/NavBar";
import dynamic from 'next/dynamic'
import Footer from "../components/Footer";
import { getAllPostsMeta } from "@/lib/posts";
import StructuredData, { generateLocalBusinessStructuredData } from "../components/StructuredData";

// Dynamically import components for better performance
const HeroSection = dynamic(() => import("../components/HeroSection"), {
  loading: () => (
    <div className="min-h-[80vh] w-full bg-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="text-center p-8 bg-black/20 rounded-lg max-w-2xl mx-auto backdrop-blur-sm">
        <div className="h-8 bg-gray-300 rounded mb-6 w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-300 rounded mb-8 w-full mx-auto"></div>
        <div className="h-12 bg-gray-300 rounded-full w-48 mx-auto"></div>
      </div>
    </div>
  )
})

const RecentPosts = dynamic(() => import("../components/RecentPosts"), {
  loading: () => (
    <section style={{
      padding: '4rem 5vw',
      background: '#f9f9f9',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: 'clamp(2rem, 5vw, 2.5rem)',
        fontWeight: 800,
        color: '#1a3a2a',
        marginBottom: '2rem'
      }}>
        Recent Posts
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            padding: '1.5rem'
          }}>
            <div style={{ height: '1.5rem', background: '#e5e7eb', borderRadius: '4px', marginBottom: '1rem' }}></div>
            <div style={{ height: '1rem', background: '#e5e7eb', borderRadius: '4px', marginBottom: '0.5rem', width: '80%' }}></div>
            <div style={{ height: '1rem', background: '#e5e7eb', borderRadius: '4px', width: '60%' }}></div>
          </div>
        ))}
      </div>
    </section>
  )
})

export default async function HomePage() {
  const posts = await getAllPostsMeta();

  const businessData = generateLocalBusinessStructuredData({
    name: "Nomadic Performance",
    description: "Professional physical therapy and performance optimization services for outdoor athletes and adventurers in Utah. Specializing in injury prevention, rehabilitation, and performance training.",
    url: "https://nomadicperformance.com",
    email: "contact@nomadicperformance.com",
    address: {
      addressLocality: "Utah",
      addressRegion: "UT",
      addressCountry: "US"
    },
    openingHours: "Mo-Fr 09:00-17:00",
    priceRange: "$$",
    image: "https://nomadicperformance.com/NPLogo.png"
  });

  return (
    <main id="main-content">
      <StructuredData data={businessData} />
      <NavBar />
      <HeroSection />
      <RecentPosts posts={posts} />
      <Footer />
    </main>
  );
}
