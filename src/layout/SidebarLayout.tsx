import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

const SidebarLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="h-dvh w-full overflow-hidden bg-[#F5F7F3]">

      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <main
        className={`
          h-dvh
          overflow-hidden
          transition-all
          duration-300
          ${isCollapsed ? "ml-20" : "ml-64"}
        `}
      >
         <Header
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        <div className="h-[calc(100%-4rem)] overflow-hidden">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default SidebarLayout;