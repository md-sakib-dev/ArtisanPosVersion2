import {
  Menu,
  KeyRound,
  LogOut,
} from "lucide-react";
import logo from "../../assets/abc.png"

interface HeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header = ({
  isCollapsed,
  setIsCollapsed,
}: HeaderProps) => {

  const handleChangePassword = () => {
    // Change password logic
  };

  const handleLogout = () => {
    // Logout logic
  };

  return (
    <header
      className="
        h-16
        w-full
        shrink-0
        bg-[#F2EEE4]
        border-b
        border-[#DDE5DF]
        flex
        items-center
        justify-between
        px-5
      "
    >

      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">

        {/* Sidebar Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            text-[#10673E]
            hover:bg-[#E8F5ED]
            transition-colors
          "
          title="Toggle Sidebar"
        >
          <Menu size={22} />
        </button>


        {/* Logo */}
        <img
          src={logo}
          alt="Company Logo"
          className="h-9 w-auto object-contain"
        />

      </div>


      {/* RIGHT SIDE */}
      <div className="flex items-center gap-2">

        {/* Change Password */}
        <button
          onClick={handleChangePassword}
          className="
            flex
            items-center
            gap-2
            rounded-lg
            px-3
            py-2
            text-sm
            font-medium
            text-[#10673E]
            hover:bg-[#E8F5ED]
            transition-colors
          "
        >
          <KeyRound size={17} />

          <span>
            Change Password
          </span>
        </button>


        {/* Logout */}
        <button
          onClick={handleLogout}
          className="
            flex
            items-center
            gap-2
            rounded-lg
            px-3
            py-2
            text-sm
            font-medium
            text-red-600
            hover:bg-red-50
            transition-colors
          "
        >
          <LogOut size={17} />

          <span>
            Logout
          </span>
        </button>

      </div>

    </header>
  );
};

export default Header;