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
      <section style={{
        padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 5vw, 2rem)',
        background: 'linear-gradient(135deg, #f9f9f9 0%, #e8f4f8 100%)',
        minHeight: 'clamp(25vh, 40vw, 35vh)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%231a3a2a" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }}></div>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
            fontWeight: 900,
            color: '#1a3a2a',
            marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            lineHeight: '1.1'
          }}>
            Blog
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 3vw, 1.4rem)',
            color: '#555',
            lineHeight: '1.6',
            maxWidth: '700px',
            margin: '0 auto clamp(2rem, 5vw, 3rem)',
            fontWeight: '500'
          }}>
            Discover expert insights, training tips, and stories from the world of outdoor performance and nomadic adventures in Utah.
          </p>

          {/* Search Bar */}
          <div style={{
            maxWidth: 'clamp(300px, 60vw, 500px)',
            margin: '0 auto clamp(1.5rem, 4vw, 2rem)'
          }}>
            <Suspense fallback={<div style={{ height: 'clamp(44px, 8vw, 56px)' }}></div>}>
              <SearchBar placeholder="Search articles..." />
            </Suspense>
          </div>

          {/* Tag Filter */}
          <Suspense fallback={<div style={{ height: 'clamp(50px, 10vw, 70px)' }}></div>}>
            <TagFilter posts={posts} />
          </Suspense>

          {/* Featured Tags */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(0.5rem, 2vw, 1rem)',
            flexWrap: 'wrap',
            marginTop: 'clamp(1.5rem, 4vw, 2rem)'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
              color: '#fff',
              padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.8rem, 2.5vw, 1.2rem)',
              borderRadius: 'clamp(16px, 5vw, 20px)',
              fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(255,107,53,0.2)'
            }}>Physical Therapy</span>
            <span style={{
              background: '#fff',
              color: '#1a3a2a',
              padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.8rem, 2.5vw, 1.2rem)',
              borderRadius: 'clamp(16px, 5vw, 20px)',
              fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
              fontWeight: 600,
              border: '2px solid #1a3a2a',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>Outdoor Fitness</span>
            <span style={{
              background: '#fff',
              color: '#1a3a2a',
              padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.8rem, 2.5vw, 1.2rem)',
              borderRadius: 'clamp(16px, 5vw, 20px)',
              fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
              fontWeight: 600,
              border: '2px solid #1a3a2a',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>Utah Adventures</span>
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
