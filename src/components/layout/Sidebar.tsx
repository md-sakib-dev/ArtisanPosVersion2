import { menuItems } from "../../data/menuitems";
import { useRole } from "../../contexts/RoleContext";
import SidebarMenu from "./SidebarMenu";
import type { MenuItem } from "../../types/menu";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

/** Filter menu items: keep a parent if at least one child is permitted.
 *  Keep leaf items if their id is in permittedIds. */
function filterMenuItems(
  items: MenuItem[],
  permittedIds: number[]
): MenuItem[] {
  const permitted = new Set(permittedIds);
  const result: MenuItem[] = [];

  for (const item of items) {
    if (item.children && item.children.length > 0) {
      const filteredChildren = filterMenuItems(item.children, permittedIds);
      if (filteredChildren.length > 0) {
        result.push({ ...item, children: filteredChildren });
      }
    } else if (item.id !== undefined && permitted.has(item.id)) {
      result.push(item);
    }
  }

  return result;
}

function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const { currentMenuIds } = useRole();
  const visibleItems = filterMenuItems(menuItems, currentMenuIds);

  return (
    <aside
      className={`
        fixed
        left-0
        top-0
        z-40
        h-screen
        overflow-y-auto
        sidebar-gloss
        text-white
        transition-all
        duration-300
        ${isCollapsed ? "w-20" : "w-64"}
      `}
    >
      {/* Header */}
      <div
        className={`
          h-20
          flex
          items-center
          border-b
          border-white/10
          ${isCollapsed ? "justify-center" : "px-6"}
        `}
      >
        {isCollapsed ? (
          <span className="text-xl font-bold">P</span>
        ) : (
          <h1 className="text-2xl font-bold">WSTech POS</h1>
        )}
      </div>

      {/* Menu */}
      <nav className="p-4 space-y-2">
        {visibleItems.map((item) => (
          <SidebarMenu
            key={item.label}
            item={item}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        ))}

        {visibleItems.length === 0 && !isCollapsed && (
          <p className="px-4 py-6 text-center text-sm text-white/50">
            No menus available for this role
          </p>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
