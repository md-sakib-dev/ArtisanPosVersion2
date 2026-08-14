import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'



const SidebarLayout = () => {
  return (
    <div className="min-h-screen bg-[#F5F2EA]">
      <Sidebar />

      <main className="ml-64 min-h-screen p-6">
        <Outlet />
      </main>
    </div>
  );
  
}