import { getPostSlugs, getPostBySlug, getAllPostsMeta } from '../posts'
import fs from 'fs/promises'
import path from 'path'

// Mock fs and path
jest.mock('fs/promises')
jest.mock('gray-matter', () => ({
  __esModule: true,
  default: jest.fn()
}))

const mockFs = fs as jest.Mocked<typeof fs>
const mockMatter = require('gray-matter').default

describe('Posts Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPostSlugs', () => {
    it('should return slugs from MDX files', async () => {
      // Mock readdir to return file names as strings
      mockFs.readdir.mockResolvedValue(['post1.mdx', 'post2.mdx', 'not-mdx.txt'] as any)

      const result = await getPostSlugs()

      expect(result).toEqual(['post1', 'post2'])
      expect(mockFs.readdir).toHaveBeenCalledWith(path.join(process.cwd(), 'src/content/posts'))
    })
  })

  describe('getPostBySlug', () => {
    it('should return post data for valid slug', async () => {
      mockMatter.mockReturnValue({
        content: 'Mock content',
        data: {
          title: 'Test Post',
          date: '2024-01-01',
          excerpt: 'Test excerpt',
          tags: ['test', 'blog']
        }
      })
      mockFs.readFile.mockResolvedValue('---\ntitle: Test Post\ndate: 2024-01-01\nexcerpt: Test excerpt\ntags: [test, blog]\n---\n\nContent')

      const result = await getPostBySlug('test-post')

      expect(result.meta.title).toBe('Test Post')
      expect(result.meta.slug).toBe('test-post')
      expect(result.content).toBe('Mock content')
    })

    it('should throw error for missing required frontmatter', async () => {
      mockMatter.mockReturnValue({
        content: 'Content',
        data: { title: 'Test' } // Missing date
      })
      mockFs.readFile.mockResolvedValue('invalid content')

      await expect(getPostBySlug('invalid-post')).rejects.toThrow('Missing required frontmatter')
    })
  })

  describe('getAllPostsMeta', () => {
    it('should return posts metadata', async () => {
      mockFs.readdir.mockResolvedValue(['post1.mdx', 'post2.mdx'] as any)
      
      mockFs.readFile.mockResolvedValue('---\ntitle: Test Post\ndate: 2024-01-01\n---\n\nContent')
      mockMatter.mockReturnValue({
        content: 'Content',
        data: { title: 'Test Post', date: '2024-01-01' }
      })

      const result = await getAllPostsMeta()

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('title')
      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('slug')
    })
  })
})
