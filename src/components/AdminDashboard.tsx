'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
}

interface BlogPost {
  slug: string
  title: string
  date: string
  excerpt: string
}

interface AdminStatus {
  isAdmin: boolean
  isMainAdmin: boolean
  isDatabaseAdmin: boolean
  user: {
    id: string
    email: string
    role?: string
    permissions?: any
  }
}

export default function AdminDashboard({ adminStatus }: { adminStatus: AdminStatus }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState<User[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    recentActivity: 0
  })
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return // Prevent fetching during SSR

    if (activeTab === 'overview') {
      fetchOverviewStats()
    } else if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'content') {
      fetchBlogPosts()
    }
  }, [activeTab])

  const fetchOverviewStats = async () => {
    setLoading(true)
    try {
      // Fetch blog posts count
      const postsResponse = await fetch('/api/admin/blog-posts')
      const posts = postsResponse.ok ? await postsResponse.json() : []
      
      // For now, we'll show current user as the only user
      // In a real app, you'd have admin APIs to get all users
      const userStats = adminStatus.isMainAdmin ? 1 : 1
      
      setStats({
        totalUsers: userStats,
        totalPosts: posts.length || 0,
        recentActivity: posts.filter((post: BlogPost) => {
          const postDate = new Date(post.date)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return postDate > weekAgo
        }).length || 0
      })
    } catch (error) {
      console.error('Error fetching overview stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        console.error('Failed to fetch users:', response.status)
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBlogPosts = async () => {
    setLoading(true)
    try {
      // Fetch blog posts from the content directory
      const response = await fetch('/api/admin/blog-posts')
      if (response.ok) {
        const posts = await response.json()
        setBlogPosts(posts)
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'content', label: 'Content', icon: '📝' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  return (
    <div style={{ padding: '2rem 5vw', background: '#f9f9f9' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
        color: '#fff',
        padding: '3rem 2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          marginBottom: '1rem',
          letterSpacing: '0.05em'
        }}>
          Admin Dashboard
        </h1>
        <p style={{
          fontSize: '1.2rem',
          opacity: 0.9,
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Manage users, content, analytics, and system settings
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #e9ecef',
        paddingBottom: '1rem',
        overflowX: 'auto'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: activeTab === tab.id ? '#1a3a2a' : '#fff',
              color: activeTab === tab.id ? '#fff' : '#1a3a2a',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        border: '1px solid #e9ecef'
      }}>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab users={users} loading={loading} adminStatus={adminStatus} />}
        {activeTab === 'content' && <ContentTab blogPosts={blogPosts} loading={loading} adminStatus={adminStatus} />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function OverviewTab() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    recentActivity: 0
  })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return // Prevent fetching during SSR

    const fetchStats = async () => {
      setLoading(true)
      try {
        // Fetch blog posts count
        const postsResponse = await fetch('/api/admin/blog-posts')
        const posts = postsResponse.ok ? await postsResponse.json() : []
        
        // Fetch users count
        const usersResponse = await fetch('/api/admin/users')
        const usersData = usersResponse.ok ? await usersResponse.json() : { users: [] }
        
        setStats({
          totalUsers: usersData.users?.length || 0,
          totalPosts: posts.length || 0,
          recentActivity: posts.filter((post: BlogPost) => {
            const postDate = new Date(post.date)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return postDate > weekAgo
          }).length || 0
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading statistics...</div>
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1.5rem' }}>
        System Overview
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem'
      }}>
        <StatCard title="Total Users" value={stats.totalUsers.toString()} change="Current" icon="👥" />
        <StatCard title="Blog Posts" value={stats.totalPosts.toString()} change="Published" icon="�" />
        <StatCard title="Recent Activity" value={stats.recentActivity.toString()} change="This week" icon="�" />
        <StatCard title="System Status" value="Online" change="Healthy" icon="✅" />
      </div>
    </div>
  )
}

function UsersTab({ users, loading, adminStatus }: { users: User[], loading: boolean, adminStatus: AdminStatus }) {
  const [fetchedUsers, setFetchedUsers] = useState<User[]>([])
  const [fetchLoading, setFetchLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return // Prevent fetching during SSR

    const loadUsers = async () => {
      if (adminStatus.isMainAdmin) {
        setFetchLoading(true)
        try {
          const response = await fetch('/api/admin/users')
          if (response.ok) {
            const data = await response.json()
            setFetchedUsers(data.users || [])
          }
        } catch (error) {
          console.error('Error fetching users:', error)
        } finally {
          setFetchLoading(false)
        }
      }
    }

    loadUsers()
  }, [adminStatus.isMainAdmin, mounted])

  const displayUsers = adminStatus.isMainAdmin ? fetchedUsers : users
  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1.5rem' }}>
        User Management
      </h2>
      {!adminStatus.isMainAdmin && (
        <div style={{
          background: '#fff3cd',
          color: '#856404',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          border: '1px solid #ffeaa7'
        }}>
          Note: Only the main admin can view and manage all users.
        </div>
      )}
      {fetchLoading || loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Joined</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Last Sign In</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    {adminStatus.isMainAdmin ? 'No users found' : 'Limited user access - contact main admin'}
                  </td>
                </tr>
              ) : (
                displayUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ padding: '1rem' }}>{user.email}</td>
                    <td style={{ padding: '1rem' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {adminStatus.isMainAdmin && user.email !== 'joe@nomadicperformance.com' && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  async function handleDeleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh the users list
        const loadUsers = async () => {
          setFetchLoading(true)
          try {
            const response = await fetch('/api/admin/users')
            if (response.ok) {
              const data = await response.json()
              setFetchedUsers(data.users || [])
            }
          } catch (error) {
            console.error('Error fetching users:', error)
          } finally {
            setFetchLoading(false)
          }
        }
        loadUsers()
      } else {
        alert('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user')
    }
  }
}

function ContentTab({ blogPosts, loading, adminStatus }: { blogPosts: BlogPost[], loading: boolean, adminStatus: AdminStatus }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPost, setNewPost] = useState({
    title: '',
    excerpt: '',
    content: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [creating, setCreating] = useState(false)

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) {
      alert('Title and content are required')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/admin/blog-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
      })

      if (response.ok) {
        alert('Blog post created successfully!')
        setShowCreateModal(false)
        setNewPost({
          title: '',
          excerpt: '',
          content: '',
          date: new Date().toISOString().split('T')[0]
        })
        // Refresh the blog posts list
        window.location.reload()
      } else {
        alert('Failed to create blog post')
      }
    } catch (error) {
      console.error('Error creating blog post:', error)
      alert('Error creating blog post')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a' }}>
            Content Management
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#1a3a2a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + New Post
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading content...</div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {blogPosts.map((post) => (
              <div key={post.slug} style={{
                padding: '1.5rem',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                background: '#f8f9fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '0.5rem' }}>
                      {post.title}
                    </h3>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      {post.excerpt}
                    </p>
                    <p style={{ color: '#999', fontSize: '0.8rem' }}>
                      Published: {new Date(post.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{
                      padding: '0.5rem 1rem',
                      background: '#007bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}>
                      Edit
                    </button>
                    <button style={{
                      padding: '0.5rem 1rem',
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a3a2a' }}>Create New Blog Post</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                  placeholder="Enter blog post title"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Excerpt</label>
                <input
                  type="text"
                  value={newPost.excerpt}
                  onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                  placeholder="Brief description of the post"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Date</label>
                <input
                  type="date"
                  value={newPost.date}
                  onChange={(e) => setNewPost({ ...newPost, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Content (Markdown)</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    minHeight: '200px',
                    fontFamily: 'monospace'
                  }}
                  placeholder="Write your blog post content in Markdown..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={creating}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: creating ? '#ccc' : '#1a3a2a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: creating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {creating ? 'Creating...' : 'Create Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AnalyticsTab() {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchAnalytics = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    else setLoading(true)

    try {
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data.data)
        setLastUpdated(new Date())
      } else {
        console.error('Failed to fetch analytics:', response.status)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!mounted) return // Prevent fetching during SSR
    fetchAnalytics()
  }, [mounted])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !mounted) return

    const interval = setInterval(() => {
      fetchAnalytics(true)
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, mounted])

  const handleRefresh = () => {
    fetchAnalytics(true)
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
  }

  const exportToCSV = () => {
    if (!analyticsData) return

    const csvData = [
      // Overview data
      ['Metric', 'Value'],
      ['Total Users', analyticsData.overview.totalUsers],
      ['New Users', analyticsData.overview.newUsers],
      ['Sessions', analyticsData.overview.sessions],
      ['Page Views', analyticsData.overview.pageViews],
      ['Avg Session Duration', analyticsData.overview.avgSessionDuration],
      ['Bounce Rate', analyticsData.overview.bounceRate],
      [],
      // Traffic sources
      ['Traffic Sources'],
      ['Source', 'Users', 'Percentage'],
      ...analyticsData.traffic.sources.map((source: any) => [source.source, source.users, `${source.percentage}%`]),
      [],
      // Device types
      ['Device Types'],
      ['Device', 'Users', 'Percentage'],
      ...analyticsData.traffic.devices.map((device: any) => [device.device, device.users, `${device.percentage}%`]),
      [],
      // Top pages
      ['Top Pages (Real-time)'],
      ['Page', 'Views'],
      ...analyticsData.realtime.topPages.map((page: any) => [page.page, page.views]),
      [],
      // Goals
      ['Goals & Conversions'],
      ['Goal', 'Completions', 'Conversion Rate'],
      ...analyticsData.goals.conversions.map((goal: any) => [goal.goal, goal.completions, goal.conversionRate])
    ]

    const csvContent = csvData.map((row: any[]) =>
      row.map((cell: any) => `"${cell}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `analytics-export-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!analyticsData) {
    return (
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a' }}>
            Analytics Dashboard
          </h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: '0.5rem 1rem',
                background: refreshing ? '#ccc' : '#1a3a2a',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {refreshing ? '🔄' : '↻'} {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={toggleAutoRefresh}
                style={{ margin: 0 }}
              />
              Auto-refresh (30s)
            </label>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
          <div style={{ color: '#666' }}>Loading analytics data...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '0.25rem' }}>
            Analytics Dashboard
          </h2>
          {analyticsData.note && (
            <div style={{
              fontSize: '0.85rem',
              color: '#059669',
              background: '#f0fdf4',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #bbf7d0',
              marginBottom: '0.5rem'
            }}>
              <strong>📊 Demo Data:</strong> {analyticsData.note}
            </div>
          )}
          {lastUpdated && (
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={exportToCSV}
            disabled={!analyticsData}
            style={{
              padding: '0.5rem 1rem',
              background: !analyticsData ? '#ccc' : '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: !analyticsData ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            📊 Export CSV
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '0.5rem 1rem',
              background: refreshing ? '#ccc' : '#1a3a2a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {refreshing ? '🔄' : '↻'} {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={toggleAutoRefresh}
              style={{ margin: 0 }}
            />
            Auto-refresh (30s)
          </label>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '1px solid #bae6fd',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite'
        }}></div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>🔴</span>
          Live Metrics (Last 30 minutes)
          <span style={{
            fontSize: '0.7rem',
            background: '#ef4444',
            color: '#fff',
            padding: '0.2rem 0.5rem',
            borderRadius: '10px',
            animation: 'pulse 2s infinite'
          }}>
            LIVE
          </span>
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '0.5rem' }}>
              {analyticsData.realtime.activeUsers}
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>Active Users</div>
            <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '0.25rem' }}>
              Real-time
            </div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '0.5rem' }}>
              {analyticsData.realtime.pageViews}
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>Page Views</div>
            <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '0.25rem' }}>
              Last 30 min
            </div>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a' }}>
            {analyticsData.overview.totalUsers.toLocaleString()}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Total Users</div>
          <div style={{ color: '#059669', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            +{analyticsData.overview.newUsers} new this month
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a' }}>
            {analyticsData.overview.pageViews.toLocaleString()}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Page Views</div>
          <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {analyticsData.overview.sessions.toLocaleString()} sessions
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a' }}>
            {analyticsData.overview.avgSessionDuration}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Avg Session</div>
          <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Bounce Rate: {analyticsData.overview.bounceRate}
          </div>
        </div>
      </div>

      {/* Traffic Sources & Devices */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Traffic Sources */}
        <div style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
            Traffic Sources
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {analyticsData.traffic.sources.map((source: any, index: number) => (
              <div key={source.source} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem',
                background: '#f8f9fa',
                borderRadius: '4px'
              }}>
                <span style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>
                  {source.source}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: '#1a3a2a' }}>
                    {source.users.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>
                    ({source.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Types */}
        <div style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
            Device Types
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {analyticsData.traffic.devices.map((device: any, index: number) => (
              <div key={device.device} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem',
                background: '#f8f9fa',
                borderRadius: '4px'
              }}>
                <span style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>
                  {device.device}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: '#1a3a2a' }}>
                    {device.users.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>
                    ({device.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Pages & Content Performance */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem'
      }}>
        {/* Top Pages */}
        <div style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
            Top Pages (Real-time)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {analyticsData.realtime.topPages.map((page: any, index: number) => (
              <div key={page.page} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem',
                background: '#f8f9fa',
                borderRadius: '4px'
              }}>
                <span style={{ fontSize: '0.9rem' }}>
                  {index + 1}. {page.page}
                </span>
                <span style={{ fontWeight: 600, color: '#1a3a2a' }}>
                  {page.views.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Performance */}
        <div style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
            Content Performance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {analyticsData.content.topPages.slice(0, 5).map((page: any, index: number) => (
              <div key={page.page} style={{
                padding: '0.5rem',
                background: '#f8f9fa',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  {page.page}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666' }}>
                  <span>{page.views.toLocaleString()} views</span>
                  <span>{page.avgTime} avg time</span>
                  <span>{page.bounceRate} bounce</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals & Conversions */}
      <div style={{
        background: '#fff',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '2rem'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
          Goals & Conversions
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          {analyticsData.goals.conversions.map((goal: any) => (
            <div key={goal.goal} style={{
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a3a2a' }}>
                {goal.completions}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                {goal.goal}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#059669' }}>
                {goal.conversionRate} conversion rate
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsTab() {
  const [settings, setSettings] = useState({
    emailNotifications: false,
    maintenanceMode: false,
    autoBackup: true,
    userRegistration: true,
    blogComments: false,
    newsletterSignup: true
  })
  const [setupStatus, setSetupStatus] = useState<{
    checked: boolean
    schemaExists: boolean
    adminUserExists: boolean
    instructions?: string[]
    error?: string
  }>({ checked: false, schemaExists: false, adminUserExists: false })
  const [settingUp, setSettingUp] = useState(false)

  const checkAdminSetup = async () => {
    try {
      const response = await fetch('/api/admin/setup', { method: 'POST' })
      const data = await response.json()

      if (response.ok) {
        setSetupStatus({
          checked: true,
          schemaExists: data.schemaExists || false,
          adminUserExists: data.adminUserExists || false,
          instructions: data.instructions
        })
      } else {
        setSetupStatus({
          checked: true,
          schemaExists: false,
          adminUserExists: false,
          error: data.error || 'Failed to check setup status'
        })
      }
    } catch (error) {
      console.error('Error checking admin setup:', error)
      setSetupStatus({
        checked: true,
        schemaExists: false,
        adminUserExists: false,
        error: 'Network error checking setup status'
      })
    }
  }

  const runSetup = async () => {
    setSettingUp(true)
    try {
      await checkAdminSetup()
    } catch (error) {
      console.error('Error running setup:', error)
    } finally {
      setSettingUp(false)
    }
  }

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    // In a real app, you'd save this to the database
    console.log(`Setting ${key} updated to ${value}`)
  }

  useEffect(() => {
    checkAdminSetup()
  }, [])

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1.5rem' }}>
        System Settings
      </h2>

      {/* Admin Setup Section */}
      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#856404', marginBottom: '1rem' }}>
          Admin System Setup
        </h3>

        {!setupStatus.checked ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔧</div>
            <p>Checking admin system status...</p>
          </div>
        ) : setupStatus.schemaExists && setupStatus.adminUserExists ? (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '1rem',
            borderRadius: '4px',
            border: '1px solid #c3e6cb'
          }}>
            ✅ Admin system is fully configured and ready to use
          </div>
        ) : setupStatus.error ? (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '1rem',
            borderRadius: '4px',
            border: '1px solid #f5c6cb'
          }}>
            ❌ Error: {setupStatus.error}
          </div>
        ) : (
          <div>
            <div style={{
              background: '#fff3cd',
              color: '#856404',
              padding: '1rem',
              borderRadius: '4px',
              border: '1px solid #ffeaa7',
              marginBottom: '1rem'
            }}>
              {setupStatus.schemaExists ?
                '✅ Database schema exists - inserting main admin user...' :
                '⚠️ Admin system needs to be set up. Please follow these steps:'
              }
            </div>

            {setupStatus.instructions && (
              <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                {setupStatus.instructions.map((instruction, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem', color: '#495057' }}>
                    {instruction}
                  </li>
                ))}
              </ol>
            )}

            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={runSetup}
                disabled={settingUp}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: settingUp ? '#ccc' : '#1a3a2a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: settingUp ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                {settingUp ? 'Setting up...' : 'Check Setup Status'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <SettingCard
          title="Email Notifications"
          description="Configure automated email notifications for user activities"
          action={<ToggleSwitch enabled={settings.emailNotifications} onChange={(value) => updateSetting('emailNotifications', value)} />}
        />
        <SettingCard
          title="Maintenance Mode"
          description="Temporarily disable the site for maintenance"
          action={<ToggleSwitch enabled={settings.maintenanceMode} onChange={(value) => updateSetting('maintenanceMode', value)} />}
        />
        <SettingCard
          title="User Registration"
          description="Allow new users to register accounts"
          action={<ToggleSwitch enabled={settings.userRegistration} onChange={(value) => updateSetting('userRegistration', value)} />}
        />
        <SettingCard
          title="Blog Comments"
          description="Enable comments on blog posts"
          action={<ToggleSwitch enabled={settings.blogComments} onChange={(value) => updateSetting('blogComments', value)} />}
        />
        <SettingCard
          title="Newsletter Signup"
          description="Show newsletter signup forms across the site"
          action={<ToggleSwitch enabled={settings.newsletterSignup} onChange={(value) => updateSetting('newsletterSignup', value)} />}
        />
        <SettingCard
          title="Automatic Backups"
          description="Configure automatic database backups"
          action={<ToggleSwitch enabled={settings.autoBackup} onChange={(value) => updateSetting('autoBackup', value)} />}
        />
        <SettingCard
          title="System Cache"
          description="Clear system cache and temporary files"
          action={<button style={{
            padding: '0.5rem 1rem',
            background: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>Clear Cache</button>}
        />
        <SettingCard
          title="Export Data"
          description="Export all system data for backup"
          action={<button style={{
            padding: '0.5rem 1rem',
            background: '#1a3a2a',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>Export</button>}
        />
      </div>
    </div>
  )
}

function StatCard({ title, value, change, icon }: { title: string, value: string, change: string, icon: string }) {
  return (
    <div style={{
      padding: '1.5rem',
      background: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '0.25rem' }}>{value}</div>
      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{
        fontSize: '0.8rem',
        color: change.startsWith('+') ? '#28a745' : '#dc3545',
        fontWeight: 600
      }}>
        {change}
      </div>
    </div>
  )
}

function SettingCard({ title, description, action }: { title: string, description: string, action: React.ReactNode }) {
  return (
    <div style={{
      padding: '1.5rem',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      background: '#f8f9fa',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '0.25rem' }}>
          {title}
        </h3>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>{description}</p>
      </div>
      {action}
    </div>
  )
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean, onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      style={{
        width: '50px',
        height: '24px',
        borderRadius: '12px',
        border: 'none',
        background: enabled ? '#1a3a2a' : '#ccc',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
    >
      <div style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#fff',
        position: 'absolute',
        top: '3px',
        left: enabled ? '29px' : '3px',
        transition: 'left 0.2s'
      }}></div>
    </button>
  )
}
