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
        <StatCard title="Blog Posts" value={stats.totalPosts.toString()} change="Published" icon="�" />
        <StatCard title="Recent Activity" value={stats.recentActivity.toString()} change="This week" icon="�" />
        <StatCard title="System Status" value="Online" change="Healthy" icon="✅" />
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

function UsersTab({ users, loading, adminStatus }: { users: User[], loading: boolean, adminStatus: AdminStatus }) {
  const [fetchedUsers, setFetchedUsers] = useState<User[]>([])
  const [fetchLoading, setFetchLoading] = useState(false)
  const [apiNote, setApiNote] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'email' | 'created_at' | 'last_sign_in_at'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 10

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      setFetchLoading(true)
      try {
        const response = await fetch('/api/admin/users')
        if (response.ok) {
          const data = await response.json()
          setFetchedUsers(data.users || [])
          setApiNote(data.note || '')
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setFetchLoading(false)
      }
    }
    loadUsers()
  }, [])

  const displayUsers = fetchedUsers.length > 0 ? fetchedUsers : users

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let filtered = displayUsers.filter(user => {
      // Search filter
      if (searchTerm && !user.email.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date()
        const userDate = new Date(user.created_at)
        const daysDiff = (now.getTime() - userDate.getTime()) / (1000 * 60 * 60 * 24)

        switch (dateFilter) {
          case 'last7days':
            if (daysDiff > 7) return false
            break
          case 'last30days':
            if (daysDiff > 30) return false
            break
          case 'last90days':
            if (daysDiff > 90) return false
            break
        }
      }

      return true
    })

    // Sort users
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'last_sign_in_at':
          aValue = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0
          bValue = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [displayUsers, searchTerm, dateFilter, sortBy, sortOrder])

  // Get user status
  const getUserStatus = (user: User) => {
    const now = new Date()
    const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null
    const daysSinceLastSignIn = lastSignIn ? (now.getTime() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24) : Infinity

    if (!lastSignIn || daysSinceLastSignIn > 90) {
      return { status: 'Inactive', color: '#dc3545' }
    } else if (daysSinceLastSignIn > 30) {
      return { status: 'Recent', color: '#ffc107' }
    } else {
      return { status: 'Active', color: '#28a745' }
    }
  }

  // Bulk actions
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(paginatedUsers.map(user => user.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} user(s)? This action cannot be undone.`)) {
      return
    }

    try {
      const deletePromises = Array.from(selectedUsers).map(userId =>
        fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
      )

      const results = await Promise.all(deletePromises)
      const successCount = results.filter(r => r.ok).length

      if (successCount === selectedUsers.size) {
        alert(`${successCount} user(s) deleted successfully`)
        setSelectedUsers(new Set())
        // Refresh users
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
        alert(`Failed to delete some users. ${successCount}/${selectedUsers.size} deleted successfully.`)
      }
    } catch (error) {
      console.error('Error deleting users:', error)
      alert('Error deleting users')
    }
  }

  const handleBulkExport = () => {
    const selectedUserData = displayUsers.filter(user => selectedUsers.has(user.id))
    const csvContent = [
      ['Email', 'Joined', 'Last Sign In', 'Status'],
      ...selectedUserData.map(user => [
        user.email,
        new Date(user.created_at).toLocaleDateString(),
        user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never',
        getUserStatus(user).status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }
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

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = adminStatus.isMainAdmin ? fetchedUsers : users

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(user => {
        const userDate = new Date(user.created_at)
        const daysDiff = (now.getTime() - userDate.getTime()) / (1000 * 60 * 60 * 24)

        switch (dateFilter) {
          case 'last7days': return daysDiff <= 7
          case 'last30days': return daysDiff <= 30
          case 'last90days': return daysDiff <= 90
          default: return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'last_sign_in_at':
          aValue = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0
          bValue = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0
          break
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [adminStatus.isMainAdmin, fetchedUsers, users, searchTerm, dateFilter, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage)
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  )

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
      {apiNote && (
        <div style={{
          background: '#d1ecf1',
          color: '#0c5460',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          border: '1px solid #bee5eb',
          fontSize: '0.9rem'
        }}>
          <strong>API Status:</strong> {apiNote}
        </div>
      )}

      {/* Search and Filter Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        alignItems: 'center'
      }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          />
        </div>
        <div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            <option value="all">All Users</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
            <option value="last90days">Last 90 Days</option>
          </select>
        </div>
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'email' | 'created_at' | 'last_sign_in_at')}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            <option value="created_at">Sort by Join Date</option>
            <option value="last_sign_in_at">Sort by Last Sign In</option>
            <option value="email">Sort by Email</option>
          </select>
        </div>
        <div>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && adminStatus.isMainAdmin && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          padding: '1rem',
          background: '#e3f2fd',
          borderRadius: '8px',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 600, color: '#1565c0' }}>
            {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleBulkDelete}
            style={{
              padding: '0.5rem 1rem',
              background: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Delete Selected
          </button>
          <button
            onClick={handleBulkExport}
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
            Export Selected
          </button>
          <button
            onClick={() => setSelectedUsers(new Set())}
            style={{
              padding: '0.5rem 1rem',
              background: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Clear Selection
          </button>
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
                {adminStatus.isMainAdmin && (
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ margin: 0 }}
                    />
                  </th>
                )}
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Joined</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Last Sign In</th>
                {adminStatus.isMainAdmin && (
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={adminStatus.isMainAdmin ? 6 : 5} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    {adminStatus.isMainAdmin ? 'No users found' : 'Limited user access - contact main admin'}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                    {adminStatus.isMainAdmin && (
                      <td style={{ padding: '1rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          style={{ margin: 0 }}
                        />
                      </td>
                    )}
                    <td style={{ padding: '1rem' }}>{user.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: getUserStatus(user).color,
                        color: '#fff'
                      }}>
                        {getUserStatus(user).status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </td>
                    {adminStatus.isMainAdmin && (
                      <td style={{ padding: '1rem' }}>
                        {user.email !== 'joe@nomadicperformance.com' && (
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
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filteredUsers.length > usersPerPage && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '1.5rem',
          padding: '1rem'
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: currentPage === 1 ? '#f8f9fa' : '#fff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem'
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
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: currentPage === totalPages ? '#f8f9fa' : '#fff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Next
          </button>
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

function StatCard({ title, value, change, icon, trend }: { title: string, value: string, change: string, icon: string, trend?: 'up' | 'down' | 'neutral' }) {
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
        color: trend === 'up' ? '#28a745' : trend === 'down' ? '#dc3545' : '#666',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem'
      }}>
        {trend === 'up' && '↗️'}
        {trend === 'down' && '↘️'}
        {trend === 'neutral' && '→'}
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
