import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import NavBar from "../../components/NavBar"
import Footer from "../../components/Footer"
import AdminDashboard from '@/components/AdminDashboard'

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

async function checkAdminAccess(): Promise<AdminStatus> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      isAdmin: false,
      isMainAdmin: false,
      isDatabaseAdmin: false,
      user: { id: '', email: '', role: '', permissions: {} }
    }
  }

  // Check if user is the main admin (joe@nomadicperformance.com)
  const isMainAdmin = user.email === 'joe@nomadicperformance.com'

  // Check if user has admin role in database
  let isDatabaseAdmin = false
  let adminUser = null

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!error && data) {
      isDatabaseAdmin = true
      adminUser = data
    }
  } catch (dbError) {
    // Table might not exist yet, treat as not a database admin
    console.log('Admin users table not found or error:', dbError)
    isDatabaseAdmin = false
  }

  const isAdmin = isMainAdmin || isDatabaseAdmin

  return {
    isAdmin,
    isMainAdmin,
    isDatabaseAdmin,
    user: {
      id: user.id,
      email: user.email || '',
      role: adminUser?.role || (isMainAdmin ? 'super_admin' : ''),
      permissions: adminUser?.permissions || (isMainAdmin ? {
        read: true,
        write: true,
        delete: true,
        manage_users: true
      } : {})
    }
  }
}

export default async function AdminPage() {
  const adminStatus = await checkAdminAccess()

  // Redirect to login if not authenticated
  if (!adminStatus.user.id) {
    redirect('/login')
  }

  // Redirect to dashboard if authenticated but not admin
  if (!adminStatus.isAdmin) {
    redirect('/dashboard')
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <NavBar />
      <AdminDashboard adminStatus={adminStatus} />
      <Footer />
    </main>
  )
}
