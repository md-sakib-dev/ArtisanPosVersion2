import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { MenuItem } from "../../types/menu";
import { NavLink, useLocation } from "react-router-dom";

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
    item.children && item.children.length > 0;

  const isChildActive =
    item.children?.some(
      (child) => child.path === location.pathname
    ) ?? false;

  const [isOpen, setIsOpen] =
    useState(isChildActive);

  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [isChildActive]);

  const handleClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsOpen(true);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div>

      {/* ============================= */}
      {/* Parent Menu */}
      {/* ============================= */}

      {hasChildren ? (
        <button
          onClick={handleClick}
          className={`
            w-full
            flex
            items-center
            gap-3
            py-3
            rounded-lg
            hover:bg-[#596B4F]
            transition-all
            duration-200
            ${isCollapsed
              ? "justify-center px-2"
              : "px-4"
            }
          `}
        >
          {/* Icon */}
          <item.icon size={20} />

          {/* Label */}
          {!isCollapsed && (
            <span className="flex-1 text-left">
              {item.label}
            </span>
          )}

          {/* Arrow */}
          {!isCollapsed && (
            <ChevronDown
              size={16}
              className={`transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>
      ) : (

        /* ============================= */
        /* Normal Navigation Menu */
        /* ============================= */

        <NavLink
          to={item.path ?? "#"}
          className={({ isActive }) =>
            `
            w-full
            flex
            items-center
            gap-3
            py-3
            rounded-lg
            transition-all
            duration-200

            ${isCollapsed
              ? "justify-center px-2"
              : "px-4"
            }

            ${
              isActive
                ? "bg-[#596B4F] text-white"
                : "hover:bg-[#596B4F]"
            }
            `
          }
        >
          {/* Icon */}
          <item.icon size={20} />

          {/* Label */}
          {!isCollapsed && (
            <span className="flex-1 text-left">
              {item.label}
            </span>
          )}
        </NavLink>
      )}

      {/* ============================= */}
      {/* Children */}
      {/* ============================= */}

      {!isCollapsed &&
        isOpen &&
        hasChildren && (
          <div className="ml-8 mt-1 space-y-1">
            {item.children!.map((child) => (
              <NavLink
                key={child.label}
                to={child.path ?? "#"}
                className={({ isActive }) =>
                  `
                  w-full
                  flex
                  items-center
                  gap-3
                  px-3
                  py-2
                  rounded-lg
                  text-sm

                  ${
                    isActive
                      ? "bg-[#596B4F] text-white"
                      : "text-gray-300 hover:bg-[#596B4F]"
                  }
                  `
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