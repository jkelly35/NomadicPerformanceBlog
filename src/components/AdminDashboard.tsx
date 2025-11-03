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
  const supabase = createClient()

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'content') {
      fetchBlogPosts()
    }
  }, [activeTab])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // Note: In a real admin setup, you'd have admin privileges to list all users
      // For now, we'll show a placeholder
      setUsers([])
    } catch (error) {
      console.error('Error fetching users:', error)
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
        <StatCard title="Total Users" value="1,234" change="+12%" icon="👥" />
        <StatCard title="Active Sessions" value="89" change="+5%" icon="🔥" />
        <StatCard title="Blog Posts" value="24" change="+2" icon="📝" />
        <StatCard title="Page Views" value="45.2K" change="+18%" icon="👁️" />
      </div>
    </div>
  )
}

function UsersTab({ users, loading, adminStatus }: { users: User[], loading: boolean, adminStatus: AdminStatus }) {
  const [fetchedUsers, setFetchedUsers] = useState<User[]>([])
  const [fetchLoading, setFetchLoading] = useState(false)

  useEffect(() => {
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
  }, [adminStatus.isMainAdmin])

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
  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1.5rem' }}>
        Analytics Dashboard
      </h2>
      <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
        <p>Analytics integration coming soon...</p>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Connect Google Analytics, track user behavior, and monitor performance metrics
        </p>
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1.5rem' }}>
        System Settings
      </h2>
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <SettingCard
          title="Email Notifications"
          description="Configure automated email notifications for user activities"
          action={<ToggleSwitch />}
        />
        <SettingCard
          title="Maintenance Mode"
          description="Temporarily disable the site for maintenance"
          action={<ToggleSwitch />}
        />
        <SettingCard
          title="Backup Settings"
          description="Configure automatic database backups"
          action={<button style={{
            padding: '0.5rem 1rem',
            background: '#1a3a2a',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>Configure</button>}
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

function ToggleSwitch() {
  const [enabled, setEnabled] = useState(false)

  return (
    <button
      onClick={() => setEnabled(!enabled)}
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
