// src/app/page.tsx
import Link from "next/link";
import { getAllPostsMeta } from "@/lib/posts";

export default async function HomePage() {
  const posts = (await getAllPostsMeta()).slice(0, 3);

  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-neutral-200 bg-white p-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Nomadic Performance
        </h1>
        <p className="mt-3 text-neutral-600">
          Evidence-based training, injury prevention, and recovery for outdoor athletes.
        </p>
        <div className="mt-6">
          <Link href="/blog" className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-95">
            Read the blog
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-xl font-bold">Latest posts</h2>
        <div className="space-y-6">
          {posts.map((p) => (
            <article key={p.slug} className="rounded-xl border border-neutral-200 p-5 hover:bg-neutral-50">
              <Link href={`/blog/${p.slug}`} className="block">
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{p.excerpt}</p>
                <p className="mt-2 text-xs text-neutral-500">{new Date(p.date).toLocaleDateString()}</p>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
