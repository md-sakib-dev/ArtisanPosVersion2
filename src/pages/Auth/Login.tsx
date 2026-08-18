import { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const success = login(username, password);
    if (success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError('Invalid username or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7F3]">
      <div className="w-full max-w-sm px-4">
        <div className="bg-white rounded-xl shadow-md border border-[#E5E7EB] overflow-hidden">
          {/* Compact Header */}
          <div className="bg-[#10673E] px-6 py-6 text-center">
           < img src={logo} alt="Logo" className="mx-auto w-full h-15 mb-2" />
            <h1 className="text-lg font-bold text-white tracking-tight">
              Wstech POS
            </h1>
            {/* <p className="text-[#D4E8DC] text-xs mt-1">
              Point of Sale System
            </p> */}
          </div>

          {/* Form */}
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-xs font-medium text-[#6B7280] mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="
                    w-full
                    px-3
                    py-2.5
                    bg-[#F9FAFB]
                    border
                    border-[#D1D5DB]
                    rounded-lg
                    text-sm
                    text-[#1F2937]
                    placeholder-[#9CA3AF]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#10673E]/20
                    focus:border-[#10673E]
                    transition-all
                  "
                  autoFocus
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-[#6B7280] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="*****"
                    className="
                      w-full
                      px-3
                      py-2.5
                      pr-10
                      bg-[#F9FAFB]
                      border
                      border-[#D1D5DB]
                      rounded-lg
                      text-sm
                      text-[#1F2937]
                      placeholder-[#9CA3AF]
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#10673E]/20
                      focus:border-[#10673E]
                      transition-all
                    "
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="
                      absolute
                      right-2.5
                      top-1/2
                      -translate-y-1/2
                      text-[#9CA3AF]
                      hover:text-[#6B7280]
                      transition-colors
                    "
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full
                  py-2.5
                  bg-[#10673E]
                  hover:bg-[#0D5A35]
                  text-white
                  text-sm
                  font-medium
                  rounded-lg
                  transition-all
                  duration-150
                  flex
                  items-center
                  justify-center
                  gap-2
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={15} />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#9CA3AF] mt-4">
          © 2026 Wstech
        </p>
      </div>
    </div>
  );
};

export default Login;
