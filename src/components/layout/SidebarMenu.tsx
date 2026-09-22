
import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { MenuItem } from "../../types/menu";

interface SidebarMenuProps {
  item: MenuItem;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

function SidebarMenu({
  item,
  isCollapsed,
  setIsCollapsed,
}: SidebarMenuProps) {
  const location = useLocation();

  const hasChildren =
    !!item.children && item.children.length > 0;

  /*
   * Check whether one of this item's children
   * is currently active.
   */
  const hasActiveChild =
    hasChildren &&
    item.children!.some(
      (child) =>
        child.path &&
        location.pathname.startsWith(child.path)
    );

  const [isOpen, setIsOpen] = useState(
    hasActiveChild || location.pathname === item.path
  );

  /*
   * Toggle submenu.
   */
  const handleToggle = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsOpen(true);
      return;
    }

    setIsOpen((prev) => !prev);
  };

  /*
   * Render icon safely.
   */
  const Icon = item.icon;

  /*
   * Parent menu with children.
   *
   * Clicking it only expands/collapses the
   * children — it never navigates.
   *
   * Example:
   *
   * Reports
   *   ├── Sales Report
   *   └── Stock Report
   */
  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={handleToggle}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          {Icon && <Icon size={20} />}

          {!isCollapsed && (
            <>
              <span className="flex-1 text-left text-sm font-medium">
                {item.label}
              </span>

              <span
                className={`transition-transform duration-200 ${
                  isOpen ? "rotate-90" : ""
                }`}
              >
                ›
              </span>
            </>
          )}
        </button>

        {!isCollapsed && isOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children!.map((child) => (
              <SidebarMenu
                key={child.id}
                item={child}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  /*
   * Normal leaf menu.
   */
  return (
    <NavLink
      to={item.path || "#"}
      onClick={() => {
        if (isCollapsed) {
          setIsCollapsed(false);
        }
      }}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-white/15 text-white"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        }`
      }
    >
      {Icon && <Icon size={20} />}

      {!isCollapsed && (
        <span className="text-sm font-medium">
          {item.label}
        </span>
      )}
    </NavLink>
  );
}

export default SidebarMenu;

