import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { MenuItem } from "../../types/menu";
import { NavLink, useLocation } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";

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
  const { currentMenuIds } = useRole();
  const permitted = new Set(currentMenuIds);

  // Filter children based on permissions
  const visibleChildren = (item.children ?? []).filter(
    (child) => child.id !== undefined && permitted.has(child.id)
  );

  const hasChildren = visibleChildren.length > 0;
  const hasPath = Boolean(item.path);

  const isChildActive = visibleChildren.some(
    (child) => child.path === location.pathname
  );

  const isParentActive = hasPath && item.path === location.pathname;

  const [isOpen, setIsOpen] = useState(isChildActive || isParentActive);

  useEffect(() => {
    if (isChildActive || isParentActive) {
      setIsOpen(true);
    }
  }, [isChildActive, isParentActive]);

  const handleParentClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsOpen(true);
    } else {
      setIsOpen(!isOpen);
    }
  };

  /* --------------------------------------------------------------- */
  /* Parent with BOTH path AND children: split into nav link + toggle  */
  /* --------------------------------------------------------------- */
  if (hasPath && hasChildren) {
    return (
      <div>
        <div className="flex items-center">
          {/* Navigation part — clicking goes to the parent path */}
          <NavLink
            to={item.path ?? "#"}
            className={({ isActive }) =>
              `flex-1 flex items-center gap-3 py-3 rounded-lg transition-all duration-200 ${
                isCollapsed ? "justify-center px-2" : "px-4"
              } ${
                isActive
                  ? "bg-[#E8F5ED] text-[#10673E]"
                  : "hover:bg-white/10"
              }`
            }
          >
            <item.icon size={20} />
            {!isCollapsed && (
              <span className="flex-1 text-left text-sm">{item.label}</span>
            )}
          </NavLink>

          {/* Expand/collapse toggle — only when not collapsed */}
          {!isCollapsed && (
            <button
              onClick={handleParentClick}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 transition-colors mr-1"
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>

        {/* Children */}
        {!isCollapsed && isOpen && (
          <div className="ml-8 mt-1 space-y-1">
            {visibleChildren.map((child) => (
              <NavLink
                key={child.label}
                to={child.path ?? "#"}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    isActive
                      ? "bg-[#E8F5ED] text-[#10673E]"
                      : "text-white/80 hover:bg-white/10"
                  }`
                }
              >
                <child.icon size={16} />
                <span>{child.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* --------------------------------------------------------------- */
  /* Parent with children only (no path) — original toggle behavior   */
  /* --------------------------------------------------------------- */
  if (hasChildren) {
    return (
      <div>
        <button
          onClick={handleParentClick}
          className={`w-full flex items-center gap-3 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 ${
            isCollapsed ? "justify-center px-2" : "px-4"
          }`}
        >
          <item.icon size={20} />
          {!isCollapsed && (
            <span className="flex-1 text-left text-sm">{item.label}</span>
          )}
          {!isCollapsed && (
            <ChevronDown
              size={16}
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {!isCollapsed && isOpen && (
          <div className="ml-8 mt-1 space-y-1">
            {visibleChildren.map((child) => (
              <NavLink
                key={child.label}
                to={child.path ?? "#"}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    isActive
                      ? "bg-[#E8F5ED] text-[#10673E]"
                      : "text-white/80 hover:bg-white/10"
                  }`
                }
              >
                <child.icon size={16} />
                <span>{child.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* --------------------------------------------------------------- */
  /* Leaf item — normal NavLink                                      */
  /* --------------------------------------------------------------- */
  return (
    <NavLink
      to={item.path ?? "#"}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 py-3 rounded-lg transition-all duration-200 ${
          isCollapsed ? "justify-center px-2" : "px-4"
        } ${
          isActive ? "bg-[#E8F5ED] text-[#10673E]" : "hover:bg-white/10"
        }`
      }
    >
      <item.icon size={20} />
      {!isCollapsed && (
        <span className="flex-1 text-left text-sm">{item.label}</span>
      )}
    </NavLink>
  );
}

export default SidebarMenu;
