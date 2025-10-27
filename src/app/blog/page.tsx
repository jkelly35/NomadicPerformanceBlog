import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import PostCard from "../../components/PostCard";
import NewsletterSignup from "../../components/NewsletterSignup";
import { getAllPostsMeta } from "@/lib/posts";

export const metadata = { title: "Blog — Nomadic Performance" };

export default async function BlogIndex() {
  const posts = await getAllPostsMeta();

  return (
    <main>
      <NavBar />
      <section style={{ padding: '4rem 5vw', background: 'linear-gradient(135deg, #f9f9f9 0%, #e8f4f8 100%)', minHeight: '30vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%231a3a2a" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', opacity: 0.3 }}></div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#1a3a2a', marginBottom: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            Blog
          </h1>
          <p style={{ fontSize: '1.3rem', color: '#555', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
            Discover expert insights, training tips, and stories from the world of outdoor performance and nomadic adventures in Utah.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ background: '#1a3a2a', color: '#fff', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>Physical Therapy</span>
            <span style={{ background: '#fff', color: '#1a3a2a', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600, border: '2px solid #1a3a2a' }}>Outdoor Fitness</span>
            <span style={{ background: '#fff', color: '#1a3a2a', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600, border: '2px solid #1a3a2a' }}>Utah Adventures</span>
          </div>
        </div>
      </section>
      <section style={{ padding: '4rem 5vw', background: '#fff', position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
              Latest Articles
            </h2>
            <p style={{ fontSize: '1.1rem', color: '#666' }}>
              Stay updated with our newest content
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
          {posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No posts yet</p>
              <p>Check back soon for new content!</p>
            </div>
          )}
        </div>
      </section>
      <NewsletterSignup />
      <Footer />
    </main>
  );
}
