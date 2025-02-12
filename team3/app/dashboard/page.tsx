'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AssignmentsTable from '../components/AssignmentsTable'


export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login')
    },
  })

  if (status === "loading") {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Upcoming Assignments</h1>
      <AssignmentsTable />
    </div>
  )
}