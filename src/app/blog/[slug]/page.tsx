// src/app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getAllPostsMeta, getPostBySlug } from "@/lib/posts";
import NavBar from "../../../components/NavBar";
import Footer from "../../../components/Footer";
import StructuredData, { generateArticleStructuredData, generateBreadcrumbStructuredData } from "@/components/StructuredData";
import ReadingProgress from "@/components/ReadingProgress";
import RelatedPosts from "@/components/RelatedPosts";
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

// Pre-generate static paths
export async function generateStaticParams() {
  const posts = await getAllPostsMeta();
  return posts.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { meta, content } = await getPostBySlug(slug).catch(() => ({ meta: null, content: "" }));
  if (!meta) return {};

  const postUrl = `https://nomadicperformance.com/blog/${slug}`;

  // Calculate reading time (average 200 words per minute)
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return {
    title: `${meta.title} — Nomadic Performance`,
    description: meta.excerpt,
    keywords: meta.tags?.join(", "),
    authors: [{ name: "Nomadic Performance" }],
    openGraph: {
      title: meta.title,
      description: meta.excerpt,
      url: postUrl,
      siteName: "Nomadic Performance",
      type: "article",
      publishedTime: meta.date,
      authors: ["Nomadic Performance"],
      tags: meta.tags,
      images: [
        {
          url: "/NPLogo.png",
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.excerpt,
      images: ["/NPLogo.png"],
      creator: "@nomadicperformance",
    },
    alternates: {
      canonical: postUrl,
    },
    other: {
      "article:reading_time": readingTime.toString(),
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { meta, content } = await getPostBySlug(slug).catch(() => ({ meta: null, content: "" }));
  if (!meta) return notFound();

  // Get all posts for related posts
  const allPosts = await getAllPostsMeta();

  // Process markdown to HTML on the server
  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
    .use(rehypeStringify)
    .process(content);

  const htmlContent = processedContent.toString();

  // Generate structured data
  const articleStructuredData = generateArticleStructuredData({
    title: meta.title,
    excerpt: meta.excerpt,
    date: meta.date,
    slug: meta.slug,
    tags: meta.tags,
    author: "Nomadic Performance"
  });

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: meta.title, url: `/blog/${meta.slug}` }
  ]);

  return (
    <main id="main-content">
      <StructuredData data={articleStructuredData} />
      <StructuredData data={breadcrumbStructuredData} />
      <ReadingProgress />
      <NavBar />
      <section style={{
        padding: '4rem 1rem 3rem',
        background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 50%, #1a3a2a 100%)',
        minHeight: '40vh',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }}></div>

        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Tags */}
          {meta.tags && meta.tags.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              {meta.tags.slice(0, 3).map((tag, index) => (
                <span key={index} style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 style={{
            fontSize: 'clamp(2.2rem, 8vw, 4rem)',
            fontWeight: 900,
            color: '#fff',
            marginBottom: '1.5rem',
            lineHeight: '1.1',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {meta.title}
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 3vw, 1.3rem)',
            color: 'rgba(255,255,255,0.9)',
            marginBottom: '2rem',
            maxWidth: '700px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.6'
          }}>
            {meta.excerpt}
          </p>

          {/* Author and Date */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '0.95rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#fff'
              }}>
                🧭
              </div>
              <span>Joseph Kelly, PT, DPT, CSCS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📅</span>
              <span>{new Date(meta.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⏱️</span>
              <span>{Math.ceil(content.split(/\s+/).length / 200)} min read</span>
            </div>
          </div>
        </div>
      </section>
      <section style={{
        padding: '4rem 1rem',
        background: '#fff'
      }}>
        <div className="blog-content" style={{
          maxWidth: '800px',
          margin: '0 auto',
          lineHeight: '1.8',
          fontSize: 'clamp(1rem, 2vw, 1.1rem)',
          color: '#333',
          fontFamily: 'Georgia, serif'
        }}>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </section>
      <RelatedPosts currentPost={meta} allPosts={allPosts} />
      <Footer />
    </main>
  );
}
