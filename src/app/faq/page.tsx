// src/app/faq/page.tsx
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import StructuredData, { generateFAQStructuredData, generateBreadcrumbStructuredData } from "@/components/StructuredData";

export const metadata = {
  title: "FAQ - Nomadic Performance",
  description: "Frequently asked questions about physical therapy services, outdoor performance coaching, and injury prevention.",
};

export default function FAQPage() {
  const faqs = [
    {
      question: "What services do you offer?",
      answer: "I provide comprehensive physical therapy services including injury assessment and treatment, performance optimization coaching, and specialized programs for outdoor athletes. Services are available both virtually and in-person in Utah."
    },
    {
      question: "Do you accept insurance?",
      answer: "Currently, I operate as a private practice and do not accept insurance. This allows me to provide personalized, high-quality care without insurance restrictions. Payment plans and package deals are available."
    },
    {
      question: "How long are sessions?",
      answer: "Initial assessments are typically 60 minutes, while follow-up sessions are 45 minutes. Specialized programs may include longer initial sessions for comprehensive evaluation and planning."
    },
    {
      question: "Do you work with athletes?",
      answer: "Absolutely! I specialize in working with outdoor athletes, runners, cyclists, climbers, and anyone pursuing active lifestyles. My approach combines clinical expertise with real-world performance optimization."
    },
    {
      question: "What should I bring to my first appointment?",
      answer: "Please bring any relevant medical records, imaging results, or previous therapy notes. Wear comfortable clothing suitable for light movement assessment. If you have specific goals or concerns, write them down to discuss during our session."
    },
    {
      question: "How do virtual sessions work?",
      answer: "Virtual sessions use secure video conferencing. You'll need a computer or tablet with a camera, and a quiet space where you can move freely. I'll guide you through assessments and exercises in real-time."
    },
    {
      question: "What conditions do you treat?",
      answer: "I treat a wide range of musculoskeletal conditions including sports injuries, chronic pain, post-surgical rehabilitation, movement dysfunctions, and performance limitations. I also focus on injury prevention and movement optimization."
    },
    {
      question: "How many sessions will I need?",
      answer: "This varies depending on your specific condition and goals. Some acute injuries may resolve in 4-6 sessions, while chronic conditions or performance optimization programs may require longer-term care. We'll discuss a personalized plan during your initial assessment."
    }
  ];

  // Generate structured data
  const faqStructuredData = generateFAQStructuredData(faqs);
  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "FAQ", url: "/faq" }
  ]);

  return (
    <main>
      <StructuredData data={faqStructuredData} />
      <StructuredData data={breadcrumbStructuredData} />
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
            fontSize: '3rem',
            fontWeight: 900,
            marginBottom: '1rem',
            letterSpacing: '0.05em',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Frequently Asked Questions
          </h1>
          <p style={{
            fontSize: '1.2rem',
            opacity: 0.95,
            lineHeight: '1.6',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            Answers to common questions about physical therapy and performance services
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '4rem 5vw', background: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          <div style={{ marginBottom: '3rem' }}>
            {faqs.map((faq, index) => (
              <div key={index} style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '1.5rem',
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: '#1a3a2a',
                  marginBottom: '1rem',
                  lineHeight: '1.4'
                }}>
                  {faq.question}
                </h3>
                <p style={{
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  color: '#555',
                  margin: 0
                }}>
                  {faq.answer}
                </p>
              </div>
            ))}
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
              fontSize: '2rem',
              fontWeight: 800,
              marginBottom: '1rem'
            }}>
              Still Have Questions?
            </h2>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              opacity: 0.95,
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}>
              Every situation is unique. If you don&apos;t see your question answered here, I&apos;d be happy to discuss your specific needs and goals.
            </p>

            <a href="/contact" style={{
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
              Get In Touch
            </a>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
