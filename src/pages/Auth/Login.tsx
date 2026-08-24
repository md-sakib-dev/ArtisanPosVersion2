import { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
//import logo from '../../assets/logo.png';

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
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Full-bleed background photo */}
      <img
        src="https://images.unsplash.com/photo-1542327534-59a1fe8daf73?fm=jpg&q=80&w=2000&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F14]/90 via-[#0B1F14]/50 to-[#0B1F14]/10" />
      <div className="absolute inset-0 bg-[#0B1F14]/20" />

      {/* Card, offset left, straddling the frame rather than dead-centered */}
      <div className="relative h-full flex items-center px-6 sm:px-12 lg:px-24">
        <div className="w-full max-w-[380px]">
          {/* Accent rule + wordmark, sitting above the card like a tag */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-md bg-[#3FCB86] flex items-center justify-center text-[#0B1F14] font-bold text-sm">
              W
            </div>
            <span className="text-white/90 text-sm font-medium tracking-wide">Wstech POS</span>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl px-7 py-8 border border-white/40">
            <h1 className="text-2xl font-semibold text-[#0B1F14] tracking-tight mb-1">
              Sign in
            </h1>
            <p className="text-sm text-[#6B7280] mb-6">
              Enter your details to open the till.
            </p>

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
                    px-3.5
                    py-2.5
                    bg-[#F5F7F3]
                    border
                    border-transparent
                    rounded-lg
                    text-sm
                    text-[#111827]
                    placeholder-[#9CA3AF]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#10673E]/25
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
                    placeholder="••••••••"
                    className="
                      w-full
                      px-3.5
                      py-2.5
                      pr-10
                      bg-[#F5F7F3]
                      border
                      border-transparent
                      rounded-lg
                      text-sm
                      text-[#111827]
                      placeholder-[#9CA3AF]
                      focus:outline-none
                      focus:ring-2
                      focus:ring-[#10673E]/25
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
                      right-3
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
                  mt-2
                "
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-white/50 text-[11px] mt-5">
            © 2026 Wstech POS
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
