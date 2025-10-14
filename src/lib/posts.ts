// src/lib/posts.ts
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type PostMeta = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  tags?: string[];
};

const POSTS_DIR = path.join(process.cwd(), "src/content/posts");

export async function getPostSlugs() {
  const files = await fs.readdir(POSTS_DIR);
  return files.filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));
}

export async function getPostBySlug(slug: string) {
  const fullPath = path.join(POSTS_DIR, `${slug}.mdx`);
  const file = await fs.readFile(fullPath, "utf8");
  const { content, data } = matter(file);

  // minimal validation
  if (!data.title || !data.date) {
    throw new Error(`Missing required frontmatter in ${slug}.mdx`);
  }

  const meta: PostMeta = {
    title: data.title,
    slug: data.slug ?? slug,
    date: data.date,
    excerpt: data.excerpt ?? "",
    tags: data.tags ?? [],
  };

  return { meta, content };
}

export async function getAllPostsMeta(): Promise<PostMeta[]> {
  const slugs = await getPostSlugs();
  const posts = await Promise.all(slugs.map((s) => getPostBySlug(s)));
  return posts
    .map((p) => p.meta)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
