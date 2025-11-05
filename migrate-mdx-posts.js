const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

async function migrateMDXPosts() {
  const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Migrating MDX posts to database...');

  const postsDir = path.join(__dirname, 'src', 'content', 'posts');
  const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.mdx'));

  for (const file of files) {
    const filePath = path.join(postsDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Parse frontmatter and content
    const { data, content } = matter(fileContent);

    // Generate slug from filename (remove .mdx extension)
    const slug = file.replace('.mdx', '');

    // Prepare post data
    const postData = {
      slug,
      title: data.title,
      excerpt: data.excerpt,
      content: content,
      status: 'published', // Assume existing posts are published
      published_at: data.date,
      created_at: data.date,
      updated_at: data.date,
      tags: data.tags || [],
      seo_title: data.title,
      seo_description: data.excerpt,
      reading_time_minutes: Math.ceil(content.split(' ').length / 200) // Rough estimate
    };

    console.log(`Migrating post: ${data.title}`);

    try {
      const { error } = await supabase
        .from('blog_posts')
        .insert(postData);

      if (error) {
        console.error(`Error inserting post ${slug}:`, error);
      } else {
        console.log(`✓ Successfully migrated: ${data.title}`);
      }
    } catch (error) {
      console.error(`Unexpected error with post ${slug}:`, error);
    }
  }

  console.log('Migration complete!');
}

// Run the migration
migrateMDXPosts().catch(console.error);
