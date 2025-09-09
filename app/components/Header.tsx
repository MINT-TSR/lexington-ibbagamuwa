"use client"
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  
  // Don't show header on login page
  if (pathname === '/login') {
    return null
  }
  
  function logout() {
    localStorage.removeItem('authenticated')
    window.location.href = '/login'
  }
  
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://i.postimg.cc/zB72KbQW/jnmtyhj.png" alt="Lexington" className="h-10 sm:h-12 w-auto" />
        <span className="text-xs sm:text-sm text-gray-600">Finance Dashboard</span>
      </div>
      <button 
        onClick={logout}
        className="text-xs bg-gray-900 text-white px-3 py-1 rounded hover:bg-black"
      >
        Logout
      </button>
    </div>
  )
}
