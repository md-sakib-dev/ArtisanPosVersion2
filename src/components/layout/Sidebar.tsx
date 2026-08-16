
import { menuItems } from "../../data/menuitems";

import SidebarMenu from "./SidebarMenu";
import { ChevronLeft ,ChevronRight} from "lucide-react";
interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}
function Sidebar({
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {

  return (
    <aside
      className={`
        fixed
        left-0
        top-0
        z-40
        h-screen
        overflow-y-auto
        bg-[#354536]
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
          <span className="text-xl font-bold">
            P
          </span>
        ) : (
          <h1 className="text-2xl font-bold">
            POS
          </h1>
        )}
      </div>


      {/* Menu */}
      <nav className="p-4 space-y-2">

        {menuItems.map((item) => (
          <SidebarMenu
            key={item.label}
            item={item}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        ))}

      </nav>


      {/* Floating Handle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="
          fixed
          top-24
          z-50
          w-7
          h-7
          rounded-full
          bg-[#F5F2EA]
          text-[#354536]
          shadow-md
          flex
          items-center
          justify-center
          hover:scale-110
          transition-all
          duration-200
        "
        style={{
          left: isCollapsed ? "68px" : "244px",
        }}
      >
        {isCollapsed ? (
          <ChevronRight size={16} />
        ) : (
          <ChevronLeft size={16} />
        )}
      </button>

    </aside>
  );
}

export default Sidebar