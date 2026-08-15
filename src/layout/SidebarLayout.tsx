import React from 'react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'



const SidebarLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
 return (
    <div className="min-h-screen bg-[#F5F2EA]">

      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <main
        className={`
          min-h-screen
          p-6
          transition-all
          duration-300
          ${isCollapsed ? "ml-20" : "ml-64"}
        `}
      >
        <Outlet />
      </main>

    </div>
  );
  
}
export default SidebarLayout