"use client"
import { useState } from 'react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)
  async function logout() {
    setLoading(true)
    await fetch('/api/logout', { method: 'POST' })
    window.location.href = '/login'
  }
  return (
    <button onClick={logout} disabled={loading} className="text-xs bg-gray-900 text-white px-3 py-1 rounded hover:bg-black">
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  )
}

