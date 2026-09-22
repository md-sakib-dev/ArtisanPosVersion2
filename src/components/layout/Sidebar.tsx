
import React from "react";
import { useRole } from "../../contexts/RoleContext";
import SidebarMenu from "./SidebarMenu";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

function Sidebar({
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  const { menuItems, sidebarLoading, sidebarError } = useRole();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen overflow-y-auto sidebar-gloss text-white transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div
        className={`h-20 flex items-center border-b border-white/10 ${
          isCollapsed ? "justify-center" : "px-6"
        }`}
      >
        {isCollapsed ? (
          <span className="text-xl font-bold">P</span>
        ) : (
          <h1 className="text-2xl font-bold">
            WSTech POS
          </h1>
        )}
      </div>

      {/* Menu */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <SidebarMenu
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        ))}

        {/* Loading / error / empty states — same styling as the menu list */}
        {sidebarLoading && !isCollapsed && (
          <p className="px-4 py-6 text-center text-sm text-white/50">
            Loading menus...
          </p>
        )}

        {!sidebarLoading && sidebarError && !isCollapsed && (
          <p className="px-4 py-6 text-center text-sm text-white/50">
            {sidebarError}
          </p>
        )}

        {!sidebarLoading && !sidebarError && menuItems.length === 0 && !isCollapsed && (
          <p className="px-4 py-6 text-center text-sm text-white/50">
            No authorized menus
          </p>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;

