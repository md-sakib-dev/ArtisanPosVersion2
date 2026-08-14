import { useState,useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { MenuItem } from "../../types/menu";
import { NavLink,useLocation } from "react-router-dom";

interface SidebarMenuProps {
  item: MenuItem;
}

function SidebarMenu({ item }: SidebarMenuProps) {
  const location=useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive =
  item.children?.some(
    (child) => child.path === location.pathname
  ) ?? false;
  const [isOpen, setIsOpen] = useState(isChildActive);
useEffect(() => {
  if (isChildActive) {
    setIsOpen(true);
  }
}, [isChildActive]);

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div>
      {hasChildren ? (
        /* Parent menu */
        <button
          onClick={handleClick}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#596B4F]"
        >
          <item.icon size={20} />

          <span className="flex-1 text-left">
            {item.label}
          </span>

          <ChevronDown
            size={16}
            className={`transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      ) : (
        /* Normal navigation menu */
        <NavLink
          to={item.path ?? "#"}
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
              isActive
                ? "bg-[#596B4F] text-white"
                : "hover:bg-[#596B4F]"
            }`
          }
        >
          <item.icon size={20} />

          <span className="flex-1 text-left">
            {item.label}
          </span>
        </NavLink>
      )}

      {/* Children */}
      {isOpen && hasChildren && (
        <div className="ml-8 mt-1 space-y-1">
          {item.children!.map((child) => (
            <NavLink
              key={child.label}
              to={child.path ?? "#"}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  isActive
                    ? "bg-[#596B4F] text-white"
                    : "text-gray-300 hover:bg-[#596B4F]"
                }`
              }
            >
              <child.icon size={16} />

              <span>
                {child.label}
              </span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default SidebarMenu;
