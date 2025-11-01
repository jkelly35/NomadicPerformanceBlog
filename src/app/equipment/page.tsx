import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import EquipmentClient from '@/components/EquipmentClient'

export default async function EquipmentPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // TODO: Fetch equipment data from database when equipment tables are created
  // For now, return empty arrays as placeholders
  const equipmentData = {
    equipment: [],
    maintenanceLogs: [],
    equipmentStats: {
      totalItems: 0,
      itemsNeedingMaintenance: 0,
      itemsOverdue: 0
    }
  }

  return (
    <EquipmentClient initialData={equipmentData} />
  )
}
