'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

interface EquipmentItem {
  id: string
  name: string
  category: string
  purchase_date: string
  last_maintenance?: string
  next_maintenance?: string
  status: 'active' | 'maintenance' | 'retired'
  notes?: string
}

interface MaintenanceLog {
  id: string
  equipment_id: string
  maintenance_type: string
  date: string
  notes?: string
}

interface EquipmentData {
  equipment: EquipmentItem[]
  maintenanceLogs: MaintenanceLog[]
  equipmentStats: {
    totalItems: number
    itemsNeedingMaintenance: number
    itemsOverdue: number
  }
}

interface EquipmentClientProps {
  initialData: EquipmentData
}

export default function EquipmentClient({ initialData }: EquipmentClientProps) {
  const [equipment] = useState<EquipmentItem[]>(initialData.equipment)
  const [maintenanceLogs] = useState<MaintenanceLog[]>(initialData.maintenanceLogs)
  const [equipmentStats] = useState(initialData.equipmentStats)

  const { user } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-slate-100">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="text-8xl mb-6">🎒</div>
          <h1 className="text-5xl font-bold text-stone-800 mb-4">
            Equipment Dashboard
          </h1>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto">
            Track your gear, manage maintenance schedules, and keep your equipment in top condition for every adventure.
          </p>
        </div>

        {/* Equipment Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-blue-200">
            <div className="text-center">
              <div className="text-4xl mb-2">🎒</div>
              <div className="text-3xl font-bold text-blue-800">{equipmentStats.totalItems}</div>
              <div className="text-sm text-blue-600">Total Equipment Items</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 shadow-lg border border-yellow-200">
            <div className="text-center">
              <div className="text-4xl mb-2">🔧</div>
              <div className="text-3xl font-bold text-yellow-800">{equipmentStats.itemsNeedingMaintenance}</div>
              <div className="text-sm text-yellow-600">Need Maintenance</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 shadow-lg border border-red-200">
            <div className="text-center">
              <div className="text-4xl mb-2">⚠️</div>
              <div className="text-3xl font-bold text-red-800">{equipmentStats.itemsOverdue}</div>
              <div className="text-sm text-red-600">Overdue Maintenance</div>
            </div>
          </div>
        </div>

        {/* Equipment Management Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-stone-200">
            <nav className="flex">
              <button className="px-6 py-4 text-stone-800 font-semibold border-b-2 border-blue-500 bg-blue-50">
                Equipment Inventory
              </button>
              <button className="px-6 py-4 text-stone-600 hover:text-stone-800 hover:bg-stone-50">
                Maintenance Logs
              </button>
              <button className="px-6 py-4 text-stone-600 hover:text-stone-800 hover:bg-stone-50">
                Add Equipment
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Equipment Inventory Tab Content */}
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-2xl font-bold text-stone-800 mb-4">Equipment Tracking Coming Soon</h3>
              <p className="text-stone-600 mb-6 max-w-md mx-auto">
                We're building a comprehensive equipment management system to help you track your gear, maintenance schedules, and equipment history.
              </p>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg inline-block">
                Feature in Development
              </div>
            </div>

            {/* Placeholder for future equipment list */}
            {equipment.length === 0 && (
              <div className="text-center text-stone-500 mt-8">
                <p>No equipment added yet. Start building your inventory!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-green-200">
            <h3 className="text-xl font-bold text-green-800 mb-2">🏃‍♂️ Ready for Adventure</h3>
            <p className="text-green-600 mb-4">Check which equipment is ready for your next trip</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Check Readiness
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-200">
            <h3 className="text-xl font-bold text-purple-800 mb-2">📅 Maintenance Schedule</h3>
            <p className="text-purple-600 mb-4">View upcoming maintenance and service reminders</p>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              View Schedule
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
