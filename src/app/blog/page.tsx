// src/app/blog/page.tsx
import Link from "next/link";
import { getAllPostsMeta } from "@/lib/posts";

export const metadata = { title: "Blog — Nomadic Performance" };

export default async function BlogIndex() {
  const posts = await getAllPostsMeta();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Blog</h1>
      <div className="space-y-6">
        {posts.map((p) => (
          <article key={p.slug} className="rounded-xl border border-neutral-200 p-5 hover:bg-neutral-50">
            <Link href={`/blog/${p.slug}`} className="block">
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{p.excerpt}</p>
              <p className="mt-2 text-xs text-neutral-500">
                {new Date(p.date).toLocaleDateString()}
              </p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
