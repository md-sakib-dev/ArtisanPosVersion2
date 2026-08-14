import React from 'react'
import { Outlet } from 'react-router-dom'



const PosLayout = () => {
  return (
    <div className="min-h-screen bg-[#F5F2EA]">
      <main className="w-full min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}

export default PosLayout