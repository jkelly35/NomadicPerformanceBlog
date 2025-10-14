// src/app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getAllPostsMeta, getPostBySlug } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// Pre-generate static paths
export async function generateStaticParams() {
  const posts = await getAllPostsMeta();
  return posts.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { meta } = await getPostBySlug(params.slug).catch(() => ({ meta: null as any }));
  if (!meta) return {};
  return {
    title: `${meta.title} — Nomadic Performance`,
    description: meta.excerpt,
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { meta, content } = await getPostBySlug(params.slug).catch(() => ({ meta: null as any, content: "" }));
  if (!meta) return notFound();

  return (
    <article className="prose prose-neutral max-w-none">
      <h1 className="mb-2">{meta.title}</h1>
      <p className="m-0 text-sm text-neutral-500">
        {new Date(meta.date).toLocaleDateString()}
      </p>
      <div className="mt-6">
        <MDXRemote
          source={content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [
                rehypeSlug,
                [rehypeAutolinkHeadings, { behavior: "wrap" }],
              ],
            },
          }}
        />
      </div>
    </article>
  );
}
