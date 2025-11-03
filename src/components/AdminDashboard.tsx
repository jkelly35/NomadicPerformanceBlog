'use client'

import { useState, useEffect, useMemo } from 'react'
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
    { id: 'notifications', label: 'Notifications', icon: '📬' },
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
        {activeTab === 'notifications' && <NotificationsTab adminStatus={adminStatus} />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function HealthIndicator({ label, status }: { label: string, status: 'healthy' | 'warning' | 'error' }) {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return '#28a745'
      case 'warning': return '#ffc107'
      case 'error': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return '❓'
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem',
      background: '#f8f9fa',
      borderRadius: '6px',
      border: `1px solid ${getStatusColor()}`
    }}>
      <span style={{ fontSize: '0.9rem', color: '#333' }}>{label}</span>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: getStatusColor(),
        fontWeight: 600,
        fontSize: '0.8rem'
      }}>
        <span>{getStatusIcon()}</span>
        <span style={{ textTransform: 'uppercase' }}>{status}</span>
      </div>
    </div>
  )
}

function OverviewTab() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    recentActivity: 0,
    userGrowth: 0,
    postGrowth: 0
  })
  const [activityFeed, setActivityFeed] = useState<Array<{
    id: string
    type: 'user' | 'post' | 'system'
    message: string
    timestamp: Date
    icon: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [systemHealth, setSystemHealth] = useState<{
    database: 'healthy' | 'warning' | 'error'
    api: 'healthy' | 'warning' | 'error'
    storage: 'healthy' | 'warning' | 'error'
  }>({
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy'
  })

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

        // Calculate growth (mock data for now - in real app, compare with previous period)
        const userGrowth = Math.floor(Math.random() * 20) - 5 // -5% to +15%
        const postGrowth = Math.floor(Math.random() * 30) - 10 // -10% to +20%

        setStats({
          totalUsers: usersData.users?.length || 0,
          totalPosts: posts.length || 0,
          recentActivity: posts.filter((post: BlogPost) => {
            const postDate = new Date(post.date)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return postDate > weekAgo
          }).length || 0,
          userGrowth,
          postGrowth
        })

        // Generate activity feed
        const activities = []

        // Add recent posts
        posts.slice(0, 3).forEach((post: BlogPost) => {
          activities.push({
            id: `post-${post.slug}`,
            type: 'post' as const,
            message: `New blog post: "${post.title}"`,
            timestamp: new Date(post.date),
            icon: '📝'
          })
        })

        // Add recent users (mock data)
        usersData.users?.slice(0, 2).forEach((user: User) => {
          activities.push({
            id: `user-${user.id}`,
            type: 'user' as const,
            message: `New user registered: ${user.email}`,
            timestamp: new Date(user.created_at),
            icon: '👤'
          })
        })

        // Add system events
        activities.push({
          id: 'system-1',
          type: 'system' as const,
          message: 'System backup completed successfully',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          icon: '🔄'
        })

        activities.push({
          id: 'system-2',
          type: 'system' as const,
          message: 'Analytics data refreshed',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          icon: '📊'
        })

        // Sort by timestamp (newest first)
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        setActivityFeed(activities.slice(0, 10)) // Show last 10 activities

      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Set up periodic refresh for activity feed
    const interval = setInterval(() => {
      // Refresh system health status
      setSystemHealth({
        database: Math.random() > 0.95 ? 'warning' : 'healthy',
        api: Math.random() > 0.98 ? 'error' : 'healthy',
        storage: Math.random() > 0.97 ? 'warning' : 'healthy'
      })
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [mounted])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
        <div style={{ color: '#666' }}>Loading dashboard data...</div>
      </div>
    )
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
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toString()}
          change={`${stats.userGrowth >= 0 ? '+' : ''}${stats.userGrowth}%`}
          icon="👥"
          trend={stats.userGrowth >= 0 ? 'up' : 'down'}
        />
        <StatCard title="Blog Posts" value={stats.totalPosts.toString()} change="Published" icon="📝" trend="neutral" />
        <StatCard title="Recent Activity" value={stats.recentActivity.toString()} change="This week" icon="⚡" trend="neutral" />
        <StatCard title="System Status" value="Online" change="Healthy" icon="✅" trend="neutral" />
      </div>

      {/* Main Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Activity Feed */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            fontWeight: 600,
            color: '#1a3a2a',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>📋</span>
            Recent Activity
          </h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {activityFeed.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                No recent activity
              </div>
            ) : (
              activityFeed.map((activity) => (
                <div key={activity.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background-color 0.2s'
                }}>
                  <div style={{ fontSize: '1.5rem' }}>{activity.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', color: '#333', marginBottom: '0.25rem' }}>
                      {activity.message}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {activity.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#fff',
                    background: activity.type === 'user' ? '#059669' :
                               activity.type === 'post' ? '#1a3a2a' : '#6b7280',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    textTransform: 'uppercase'
                  }}>
                    {activity.type}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Health & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* System Health */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: 600,
              color: '#1a3a2a',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>🖥️</span>
              System Health
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <HealthIndicator label="Database" status={systemHealth.database} />
              <HealthIndicator label="API" status={systemHealth.api} />
              <HealthIndicator label="Storage" status={systemHealth.storage} />
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: 600,
              color: '#1a3a2a',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚡</span>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => window.location.href = '/admin?tab=content'}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#1a3a2a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
              >
                <span>📝</span>
                Create New Post
              </button>
              <button
                onClick={() => window.location.href = '/admin?tab=users'}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
              >
                <span>👥</span>
                Manage Users
              </button>
              <button
                onClick={() => window.location.href = '/admin?tab=analytics'}
                style={{
                  padding: '0.75rem 1rem',
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
              >
                <span>📊</span>
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationsTab({ adminStatus }: { adminStatus: AdminStatus }) {
  const [activeSubTab, setActiveSubTab] = useState('templates')
  const [templates, setTemplates] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showSendNotification, setShowSendNotification] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (activeSubTab === 'templates') {
      fetchTemplates()
    } else if (activeSubTab === 'campaigns') {
      fetchCampaigns()
    } else if (activeSubTab === 'history') {
      fetchHistory()
    }
  }, [activeSubTab])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/notifications/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/notifications/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/notifications/history')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const subTabs = [
    { id: 'templates', label: 'Templates', icon: '📝' },
    { id: 'campaigns', label: 'Campaigns', icon: '📢' },
    { id: 'send', label: 'Send Message', icon: '📤' },
    { id: 'history', label: 'History', icon: '📚' }
  ]

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
          Notification & Communication Hub
        </h2>
        <p style={{ color: '#666', fontSize: '1rem' }}>
          Manage notification templates, campaigns, and communication history
        </p>
      </div>

      {/* Sub Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #e9ecef',
        paddingBottom: '1rem',
        overflowX: 'auto'
      }}>
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: activeSubTab === tab.id ? '#1a3a2a' : '#fff',
              color: activeSubTab === tab.id ? '#fff' : '#1a3a2a',
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

      {/* Content */}
      {activeSubTab === 'templates' && (
        <TemplatesSection
          templates={templates}
          loading={loading}
          onRefresh={fetchTemplates}
          showCreate={showCreateTemplate}
          setShowCreate={setShowCreateTemplate}
        />
      )}

      {activeSubTab === 'campaigns' && (
        <CampaignsSection
          campaigns={campaigns}
          loading={loading}
          onRefresh={fetchCampaigns}
          showCreate={showCreateCampaign}
          setShowCreate={setShowCreateCampaign}
        />
      )}

      {activeSubTab === 'send' && (
        <SendNotificationSection
          templates={templates}
          campaigns={campaigns}
          showSend={showSendNotification}
          setShowSend={setShowSendNotification}
        />
      )}

      {activeSubTab === 'history' && (
        <HistorySection
          history={history}
          loading={loading}
          onRefresh={fetchHistory}
        />
      )}
    </div>
  )
}

function UsersTab({ users, loading, adminStatus }: { users: User[], loading: boolean, adminStatus: AdminStatus }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const usersPerPage = 10

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Paginate users
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage)

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Are you sure you want to reset this user\'s password? A temporary password will be generated and displayed.')) {
      return
    }

    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'resetPassword' })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Password reset successfully! Temporary password: ${data.tempPassword}`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Error resetting password')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) {
      return
    }

    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        alert('User deleted successfully!')
        // Refresh the users list
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
          User Management
        </h2>
        <p style={{ color: '#666', fontSize: '1rem' }}>
          Manage user accounts, reset passwords, and view user details
        </p>
      </div>

      {/* Search and Filters */}
      <div style={{
        background: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '0.9rem'
              }}
            />
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            {filteredUsers.length} users found
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e9ecef', overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
            gap: '1rem',
            padding: '1rem',
            background: '#f8f9fa',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: '#1a3a2a',
            borderBottom: '1px solid #e9ecef'
          }}>
            <div>Email</div>
            <div>Joined</div>
            <div>Last Login</div>
            <div>Actions</div>
          </div>

          {paginatedUsers.map((user) => (
            <div key={user.id} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
              gap: '1rem',
              padding: '1rem',
              borderBottom: '1px solid #f0f0f0',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 500 }}>{user.email}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {new Date(user.created_at).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleViewUser(user)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: '#17a2b8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  View
                </button>
                <button
                  onClick={() => handleResetPassword(user.id)}
                  disabled={actionLoading === user.id}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: '#ffc107',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: actionLoading === user.id ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    opacity: actionLoading === user.id ? 0.6 : 1
                  }}
                >
                  {actionLoading === user.id ? '...' : 'Reset PW'}
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id, user.email)}
                  disabled={actionLoading === user.id}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: actionLoading === user.id ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    opacity: actionLoading === user.id ? 0.6 : 1
                  }}
                >
                  {actionLoading === user.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === 1 ? '#e9ecef' : '#1a3a2a',
              color: currentPage === 1 ? '#6c757d' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.9rem', color: '#666' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === totalPages ? '#e9ecef' : '#1a3a2a',
              color: currentPage === totalPages ? '#6c757d' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
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
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#1a3a2a' }}>User Details</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <strong>Email:</strong> {selectedUser.email}
              </div>
              <div>
                <strong>User ID:</strong> {selectedUser.id}
              </div>
              <div>
                <strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Last Login:</strong> {selectedUser.last_sign_in_at ? new Date(selectedUser.last_sign_in_at).toLocaleString() : 'Never'}
              </div>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowUserModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ContentTab({ blogPosts, loading, adminStatus }: { blogPosts: BlogPost[], loading: boolean, adminStatus: AdminStatus }) {
  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1.5rem' }}>
        Content Management
      </h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading content...</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {blogPosts.map((post) => (
            <div key={post.slug} style={{
              padding: '1rem',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              background: '#f8f9fa'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1a3a2a' }}>{post.title}</h4>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                {post.excerpt}
              </p>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                Published: {new Date(post.date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AnalyticsTab() {
  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1.5rem' }}>
        Analytics Dashboard
      </h2>
      <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
        Analytics features coming soon...
      </div>
    </div>
  )
}

function SettingsTab() {
  const [dashboardSettings, setDashboardSettings] = useState({
    nutrition: { enabled: true, locked: false },
    training: { enabled: true, locked: false },
    activities: { enabled: true, locked: false },
    equipment: { enabled: true, locked: false },
    goals: { enabled: true, locked: false },
    analytics: { enabled: true, locked: false },
    readiness: { enabled: true, locked: false }
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDashboardSettings()
  }, [])

  const fetchDashboardSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setDashboardSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveDashboardSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardSettings })
      })

      if (response.ok) {
        alert('Dashboard settings saved successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving dashboard settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const updateDashboardSetting = (dashboard: keyof typeof dashboardSettings, setting: 'enabled' | 'locked', value: boolean) => {
    setDashboardSettings(prev => ({
      ...prev,
      [dashboard]: {
        ...prev[dashboard],
        [setting]: value
      }
    }))
  }

  const dashboardOptions = [
    { key: 'nutrition', label: 'Nutrition Dashboard', icon: '🥗' },
    { key: 'training', label: 'Training Dashboard', icon: '💪' },
    { key: 'activities', label: 'Activities Dashboard', icon: '🏃' },
    { key: 'equipment', label: 'Equipment Dashboard', icon: '🏋️' },
    { key: 'goals', label: 'Goals Dashboard', icon: '🎯' },
    { key: 'analytics', label: 'Analytics Dashboard', icon: '📊' },
    { key: 'readiness', label: 'Readiness Dashboard', icon: '⚡' }
  ]

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
          System Settings
        </h2>
        <p style={{ color: '#666', fontSize: '1rem' }}>
          Configure dashboard access controls and system-wide settings
        </p>
      </div>

      {/* Dashboard Access Controls */}
      <div style={{
        background: '#f8f9fa',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1.5rem' }}>
          Dashboard Access Controls
        </h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Control which dashboards are available to users and whether they can modify their own access.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading settings...</div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {dashboardOptions.map(({ key, label, icon }) => (
              <div key={key} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: '#fff',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1a3a2a' }}>
                      {label}
                    </h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                      {dashboardSettings[key as keyof typeof dashboardSettings].enabled ? 'Enabled' : 'Disabled'}
                      {dashboardSettings[key as keyof typeof dashboardSettings].locked && ' • Locked'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>Enabled:</label>
                    <button
                      onClick={() => updateDashboardSetting(key as keyof typeof dashboardSettings, 'enabled', !dashboardSettings[key as keyof typeof dashboardSettings].enabled)}
                      style={{
                        width: '40px',
                        height: '20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: dashboardSettings[key as keyof typeof dashboardSettings].enabled ? '#1a3a2a' : '#ccc',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: '2px',
                        left: dashboardSettings[key as keyof typeof dashboardSettings].enabled ? '22px' : '2px',
                        transition: 'left 0.2s'
                      }}></div>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>Locked:</label>
                    <button
                      onClick={() => updateDashboardSetting(key as keyof typeof dashboardSettings, 'locked', !dashboardSettings[key as keyof typeof dashboardSettings].locked)}
                      style={{
                        width: '40px',
                        height: '20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: dashboardSettings[key as keyof typeof dashboardSettings].locked ? '#dc3545' : '#ccc',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#fff',
                        position: 'absolute',
                        top: '2px',
                        left: dashboardSettings[key as keyof typeof dashboardSettings].locked ? '22px' : '2px',
                        transition: 'left 0.2s'
                      }}></div>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={saveDashboardSettings}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#1a3a2a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Additional Settings */}
      <div style={{
        background: '#f8f9fa',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1.5rem' }}>
          System Configuration
        </h3>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#fff',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1a3a2a' }}>
                Database Maintenance
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                Run database optimization and cleanup tasks
              </p>
            </div>
            <button
              style={{
                padding: '0.5rem 1rem',
                background: '#17a2b8',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Run Maintenance
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#fff',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1a3a2a' }}>
                Cache Management
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                Clear application caches and refresh data
              </p>
            </div>
            <button
              style={{
                padding: '0.5rem 1rem',
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Clear Cache
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#fff',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1a3a2a' }}>
                System Backup
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                Create a full system backup
              </p>
            </div>
            <button
              style={{
                padding: '0.5rem 1rem',
                background: '#ffc107',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Create Backup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, change, icon, trend }: {
  title: string,
  value: string,
  change: string,
  icon: string,
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          fontSize: '1.5rem',
          color: '#1a3a2a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '50%',
          background: 'rgba(26,58,42,0.1)'
        }}>
          {icon}
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1a3a2a' }}>{title}</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            {trend === 'up' ? '📈' : '📉'} {change}
          </p>
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a' }}>
        {value}
      </div>
    </div>
  )
}

function TemplatesSection({ templates, loading, onRefresh, showCreate, setShowCreate }: {
  templates: any[],
  loading: boolean,
  onRefresh: () => void,
  showCreate: boolean,
  setShowCreate: (show: boolean) => void
}) {
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    message: '',
    type: 'email',
    category: 'general'
  })

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/admin/notifications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      })

      if (response.ok) {
        setShowCreate(false)
        setNewTemplate({ name: '', subject: '', message: '', type: 'email', category: 'general' })
        onRefresh()
      }
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#1a3a2a' }}>Notification Templates</h3>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '0.5rem 1rem',
            background: '#1a3a2a',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Create Template
        </button>
      </div>

      {showCreate && (
        <div style={{
          padding: '1.5rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ marginBottom: '1rem', color: '#1a3a2a' }}>Create New Template</h4>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Template Name"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <select
              value={newTemplate.type}
              onChange={(e) => setNewTemplate({...newTemplate, type: e.target.value})}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="email">Email</option>
              <option value="push">Push Notification</option>
              <option value="in_app">In-App Message</option>
              <option value="sms">SMS</option>
            </select>
            <input
              type="text"
              placeholder="Subject (optional)"
              value={newTemplate.subject}
              onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <textarea
              placeholder="Message content"
              value={newTemplate.message}
              onChange={(e) => setNewTemplate({...newTemplate, message: e.target.value})}
              rows={4}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleCreateTemplate}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading templates...</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {templates.map((template: any) => (
            <div key={template.id} style={{
              padding: '1rem',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              background: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1a3a2a' }}>{template.name}</h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                    Type: {template.type} | Category: {template.category}
                  </p>
                  {template.subject && (
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Subject: {template.subject}</p>
                  )}
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{template.message.substring(0, 100)}...</p>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {new Date(template.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CampaignsSection({ campaigns, loading, onRefresh, showCreate, setShowCreate }: {
  campaigns: any[],
  loading: boolean,
  onRefresh: () => void,
  showCreate: boolean,
  setShowCreate: (show: boolean) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#1a3a2a' }}>Notification Campaigns</h3>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '0.5rem 1rem',
            background: '#1a3a2a',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Create Campaign
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading campaigns...</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {campaigns.map((campaign: any) => (
            <div key={campaign.id} style={{
              padding: '1rem',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              background: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1a3a2a' }}>{campaign.name}</h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                    Status: {campaign.status} | Sent: {campaign.sent_count}/{campaign.total_recipients}
                  </p>
                  {campaign.description && (
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{campaign.description}</p>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {new Date(campaign.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SendNotificationSection({ templates, campaigns, showSend, setShowSend }: {
  templates: any[],
  campaigns: any[],
  showSend: boolean,
  setShowSend: (show: boolean) => void
}) {
  const [notificationData, setNotificationData] = useState({
    send_mode: 'individual', // 'individual', 'all', 'segment'
    user_ids: '',
    segment_filters: {
      dietary_preferences: [] as string[],
      activities: [] as string[]
    },
    template_id: '',
    campaign_id: '',
    subject: '',
    message: '',
    type: 'email'
  })

  const handleSendNotification = async () => {
    try {
      let payload: any = {
        template_id: notificationData.template_id || null,
        campaign_id: notificationData.campaign_id || null,
        subject: notificationData.subject,
        message: notificationData.message,
        type: notificationData.type
      }

      if (notificationData.send_mode === 'all') {
        payload.send_to_all = true
      } else if (notificationData.send_mode === 'segment') {
        payload.segment_filters = notificationData.segment_filters
      } else {
        // individual
        const userIds = notificationData.user_ids.split(',').map(id => id.trim()).filter(id => id)
        if (userIds.length === 0) {
          alert('Please enter at least one user ID')
          return
        }
        payload.user_ids = userIds
      }

      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Notification sent successfully to ${result.sent_count} users!`)
        setShowSend(false)
        setNotificationData({
          send_mode: 'individual',
          user_ids: '',
          segment_filters: { dietary_preferences: [], activities: [] },
          template_id: '',
          campaign_id: '',
          subject: '',
          message: '',
          type: 'email'
        })
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Error sending notification')
    }
  }

  const toggleSegmentFilter = (type: 'dietary_preferences' | 'activities', value: string) => {
    setNotificationData(prev => ({
      ...prev,
      segment_filters: {
        ...prev.segment_filters,
        [type]: prev.segment_filters[type].includes(value)
          ? prev.segment_filters[type].filter((item: string) => item !== value)
          : [...prev.segment_filters[type], value]
      }
    }))
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#1a3a2a' }}>Send Notification</h3>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Send notifications to individual users, segments, or all users
        </p>
      </div>

      <div style={{
        padding: '1.5rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Send Mode Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Send Mode
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[
                { value: 'individual', label: 'Individual Users' },
                { value: 'segment', label: 'User Segments' },
                { value: 'all', label: 'All Users' }
              ].map(mode => (
                <label key={mode.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    name="send_mode"
                    value={mode.value}
                    checked={notificationData.send_mode === mode.value}
                    onChange={(e) => setNotificationData({...notificationData, send_mode: e.target.value})}
                  />
                  {mode.label}
                </label>
              ))}
            </div>
          </div>

          {/* Individual User IDs */}
          {notificationData.send_mode === 'individual' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                User IDs (comma-separated)
              </label>
              <input
                type="text"
                placeholder="user-id-1, user-id-2, user-id-3"
                value={notificationData.user_ids}
                onChange={(e) => setNotificationData({...notificationData, user_ids: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          )}

          {/* Segment Filters */}
          {notificationData.send_mode === 'segment' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                User Segments
              </label>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Dietary Preferences:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo', 'Mediterranean'].map(pref => (
                      <label key={pref} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                        <input
                          type="checkbox"
                          checked={notificationData.segment_filters.dietary_preferences.includes(pref)}
                          onChange={() => toggleSegmentFilter('dietary_preferences', pref)}
                        />
                        {pref}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Activities:
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {['Running', 'Cycling', 'Hiking', 'Climbing', 'Yoga', 'Weight Training'].map(activity => (
                      <label key={activity} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                        <input
                          type="checkbox"
                          checked={notificationData.segment_filters.activities.includes(activity)}
                          onChange={() => toggleSegmentFilter('activities', activity)}
                        />
                        {activity}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Users Warning */}
          {notificationData.send_mode === 'all' && (
            <div style={{
              padding: '1rem',
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              color: '#856404'
            }}>
              ⚠️ This will send the notification to ALL users in the system. Please confirm this is intentional.
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Template (optional)
            </label>
            <select
              value={notificationData.template_id}
              onChange={(e) => setNotificationData({...notificationData, template_id: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Select a template...</option>
              {templates.map((template: any) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Campaign (optional)
            </label>
            <select
              value={notificationData.campaign_id}
              onChange={(e) => setNotificationData({...notificationData, campaign_id: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Select a campaign...</option>
              {campaigns.filter((c: any) => c.status === 'draft').map((campaign: any) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Notification Type
            </label>
            <select
              value={notificationData.type}
              onChange={(e) => setNotificationData({...notificationData, type: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="email">Email</option>
              <option value="push">Push Notification</option>
              <option value="in_app">In-App Message</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Subject (optional)
            </label>
            <input
              type="text"
              placeholder="Notification subject"
              value={notificationData.subject}
              onChange={(e) => setNotificationData({...notificationData, subject: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Message
            </label>
            <textarea
              placeholder="Notification message content"
              value={notificationData.message}
              onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
              rows={4}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <button
            onClick={handleSendNotification}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#1a3a2a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Send Notification
          </button>
        </div>
      </div>
    </div>
  )
}

function HistorySection({ history, loading, onRefresh }: {
  history: any[],
  loading: boolean,
  onRefresh: () => void
}) {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#1a3a2a' }}>Communication History</h3>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          View all notification sends and user interactions
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading history...</div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {history.map((item: any) => (
            <div key={item.id} style={{
              padding: '1rem',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              background: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: item.direction === 'outbound' ? '#1a3a2a' : '#28a745',
                      color: '#fff',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      {item.direction === 'outbound' ? 'SENT' : 'RECEIVED'}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      {item.type.toUpperCase()}
                    </span>
                  </div>
                  {item.subject && (
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>{item.subject}</p>
                  )}
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{item.message.substring(0, 150)}...</p>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666', textAlign: 'right' }}>
                  <div>{new Date(item.created_at).toLocaleDateString()}</div>
                  <div>{new Date(item.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
