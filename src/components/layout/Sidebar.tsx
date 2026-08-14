
import { menuItems } from "../../data/menuitems";

import SidebarMenu from "./SidebarMenu";
function Sidebar() {

  return (
    <aside className="w-64 min-h-screen bg-[#354536] text-white">

      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-white/10">
        <h1 className="text-2xl font-bold">
          POS
        </h1>
      </div>

      {/* Menu */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <SidebarMenu
            key={item.label}
            item={item}
          />
        ))}
      </nav>

    </aside>
  );
}

export default Sidebar