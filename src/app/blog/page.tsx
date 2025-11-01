// src/app/blog/page.tsx
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import NewsletterSignup from "../../components/NewsletterSignup";
import SearchBar from "../../components/SearchBar";
import TagFilter from "../../components/TagFilter";
import BlogContent from "../../components/BlogContent";
import { getAllPostsMeta } from "@/lib/posts";
import { Suspense } from 'react';
import StructuredData, { generateBreadcrumbStructuredData } from "@/components/StructuredData";

export const metadata = { title: "Blog — Nomadic Performance" };

export default async function BlogIndex() {
  const posts = await getAllPostsMeta();

  // Generate breadcrumb structured data
  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" }
  ]);

  return (
    <main id="main-content">
      <StructuredData data={breadcrumbStructuredData} />
      <NavBar />
      <section style={{ padding: '4rem 5vw', background: 'linear-gradient(135deg, #f9f9f9 0%, #e8f4f8 100%)', minHeight: '30vh', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%231a3a2a" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', opacity: 0.3 }}></div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#1a3a2a', marginBottom: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            Blog
          </h1>
          <p style={{ fontSize: '1.3rem', color: '#555', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Discover expert insights, training tips, and stories from the world of outdoor performance and nomadic adventures in Utah.
          </p>

          {/* Search Bar */}
          <div style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>
            <Suspense fallback={<div style={{ height: '40px' }}></div>}>
              <SearchBar placeholder="Search articles..." />
            </Suspense>
          </div>

          {/* Tag Filter */}
          <Suspense fallback={<div style={{ height: '60px' }}></div>}>
            <TagFilter posts={posts} />
          </Suspense>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ background: '#1a3a2a', color: '#fff', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>Physical Therapy</span>
            <span style={{ background: '#fff', color: '#1a3a2a', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600, border: '2px solid #1a3a2a' }}>Outdoor Fitness</span>
            <span style={{ background: '#fff', color: '#1a3a2a', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600, border: '2px solid #1a3a2a' }}>Utah Adventures</span>
          </div>
        </div>
      </section>

      <Suspense fallback={<div style={{ padding: '4rem 5vw', textAlign: 'center' }}>Loading articles...</div>}>
        <BlogContent posts={posts} />
      </Suspense>
      <NewsletterSignup />
      <Footer />
    </main>
  );
}
