import React from 'react'
import { Outlet } from 'react-router-dom'



const PosLayout = () => {
 return (
    <div className="h-dvh w-full overflow-hidden">
      <Outlet />
    </div>
  );
  
}

export default PosLayout