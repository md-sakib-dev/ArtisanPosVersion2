import {
  User,
  ChevronDown,

  Menu,
  KeyRound,
  LogOut,
  UserRound,
  Shield,
} from "lucide-react";
import logo from "../../assets/abc.png";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface HeaderProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header = ({ isCollapsed, setIsCollapsed }: HeaderProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChangePassword = () => {
    setIsUserMenuOpen(false);
    navigate("/changepassword");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const ROLE_BADGE_COLORS: Record<string, string> = {
    Administrator: "bg-[#10673E]/10 text-[#10673E]",
    "Sales Manager": "bg-[#2D5597]/10 text-[#2D5597]",
    "Inventory Manager": "bg-[#3AAFA9]/10 text-[#3AAFA9]",
    "Sales User": "bg-[#E2BA48]/15 text-[#C9A02E]",
    "Report User": "bg-[#50B4D8]/10 text-[#0E8FBF]",
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
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#10673E] hover:bg-[#E8F5ED] transition-colors"
          title="Toggle Sidebar"
        >
          <Menu size={22} />
        </button>
        <Link to="/">
        
        <img
          src={logo}
          alt="Company Logo"
          className="h-9 w-auto object-contain"
        />
        </Link>

        {/* <button
          onClick={() => navigate("/dashboard")}
          className="
            flex
            h-9
            items-center
            gap-1.5
            rounded-lg
            px-3
            text-[13px]
            font-semibold
            text-[#10673E]
            transition-colors
            hover:bg-[#E8F5ED]
          "
          title="Go to Dashboard"
        >
          <LayoutDashboard size={17} />
          Dashboard
        </button> */}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        {user?.roleName && (
          <div
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${
              ROLE_BADGE_COLORS[user.roleName] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            <Shield size={14} />
            <span className="text-[12px] font-semibold">{user.roleName}</span>
          </div>
        )}

        {/* User Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[#10673E] hover:bg-[#E8F5ED] transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5ED]">
              <User size={17} />
            </div>
            <ChevronDown
              size={15}
              className={`transition-transform ${
                isUserMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-[#DDE5DF] bg-white shadow-lg">
              {/* User Info */}
              <div className="border-b border-[#DDE5DF] px-4 py-3">
                <p className="text-sm font-semibold text-[#17231D]">
                  {user?.displayName || "User"}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {user?.roleName ?? "No Role"}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#17231D] hover:bg-[#F1F8F3] transition-colors"
              >
                <UserRound size={16} className="text-[#10673E]" />
                <span>View My Info</span>
              </button>

              <button
                onClick={handleChangePassword}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#17231D] hover:bg-[#F1F8F3] transition-colors"
              >
                <KeyRound size={16} className="text-[#10673E]" />
                <span>Change Password</span>
              </button>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
