// src/app/page.tsx
import NavBar from "../components/NavBar";
import HeroSection from "../components/HeroSection";
import RecentPosts from "../components/RecentPosts";
import Footer from "../components/Footer";
import { getAllPostsMeta } from "@/lib/posts";

export default async function HomePage() {
  const posts = await getAllPostsMeta();

  return (
    <main>
      <NavBar />
      <HeroSection />
      <RecentPosts posts={posts} />
      <Footer />
    </main>
  );
}
