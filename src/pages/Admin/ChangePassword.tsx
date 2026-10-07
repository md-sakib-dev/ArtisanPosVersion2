import { useState } from "react";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import {
  changePassword,
} from "../../api/authApi";
import type {
  ChangePasswordRequest,
} from "../../api/authApi";

/*
 * Extract the backend error message from an API error.
 * Falls back to a generic message — raw Axios errors
 * are never shown to the user.
 */
const getErrorMessage = (error: unknown): string => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string" &&
    error.response.data.message.trim() !== ""
  ) {
    return error.response.data.message;
  }

  return "Failed to change password. Please try again.";
};

// ======================================================
// TOAST
// ======================================================

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useState(() => setTimeout(onClose, 3000));
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
        type === "success"
          ? "border-[#10673E]/20 bg-white text-[#10673E]"
          : "border-red-200 bg-white text-red-600"
      }`}
      style={{ animation: "fade-up 0.3s ease both" }}
    >
      {type === "success" ? <CheckCircle2 size={18} /> : <X size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-[#94A3B8] hover:text-[#64748B]"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ======================================================
// PAGE
// ======================================================

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();

  // Password strength
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(newPassword);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-[#10673E]",
  ];
  const strengthTextColors = [
    "text-red-500",
    "text-orange-500",
    "text-yellow-600",
    "text-blue-500",
    "text-[#10673E]",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    if (!currentPassword) {
      setToast({ message: "Please enter your current password", type: "error" });
      return;
    }
    if (!newPassword) {
      setToast({ message: "Please enter a new password", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ message: "New password must be at least 6 characters", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ message: "New password and confirmation do not match", type: "error" });
      return;
    }
    if (currentPassword === newPassword) {
      setToast({ message: "New password must be different from current password", type: "error" });
      return;
    }

    /*
     * Username comes from the logged-in user —
     * never from localStorage.
     */
    if (!user) {
      setToast({ message: "You are not logged in", type: "error" });
      return;
    }

    const requestData: ChangePasswordRequest = {
      userName: user.username,
      currentPassword,
      newPassword,
      confirmPassword,
    };

    setSubmitting(true);

    try {
      const response = await changePassword(requestData);

      if (response.success) {
        setToast({ message: "Password changed successfully", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setToast({
          message: response.message || "Failed to change password. Please try again.",
          type: "error",
        });
      }
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7F3]">
      <div
        className="mx-auto max-w-[800px] space-y-5 p-4 lg:p-6"
        style={{ animation: "fade-up 0.4s ease both" }}
      >
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* HEADER */}
        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <KeyRound size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Change Password
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Update your account password to keep your account secure
              </p>
            </div>
          </div>
        </header>

        {/* PASSWORD FORM */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
              <Lock size={14} />
            </div>
            <h2 className="text-[14px] font-bold text-[#1F2937]">
              Update Password
            </h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              {/* Current Password */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                  <Lock size={13} className="text-[#6B7280]" />
                  Current Password <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-4 pr-11 text-[13px] text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:bg-white focus:ring-2 focus:ring-[#10673E]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors hover:text-[#64748B]"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#E5E7EB]" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  New Password
                </span>
                <div className="h-px flex-1 bg-[#E5E7EB]" />
              </div>

              {/* New Password */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                  <KeyRound size={13} className="text-[#6B7280]" />
                  New Password <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="h-11 w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] px-4 pr-11 text-[13px] text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:bg-white focus:ring-2 focus:ring-[#10673E]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors hover:text-[#64748B]"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength */}
                {newPassword.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-[#94A3B8]">
                        Password Strength
                      </span>
                      <span className={`text-[11px] font-semibold ${strengthTextColors[Math.max(0, strength - 1)] || "text-[#94A3B8]"}`}>
                        {strengthLabels[Math.max(0, strength - 1)] || "Very Weak"}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i < strength
                              ? strengthColors[Math.max(0, strength - 1)]
                              : "bg-[#E5E7EB]"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      <div className={`flex items-center gap-1.5 text-[11px] ${newPassword.length >= 8 ? "text-[#10673E]" : "text-[#94A3B8]"}`}>
                        <div className={`h-1 w-1 rounded-full ${newPassword.length >= 8 ? "bg-[#10673E]" : "bg-[#D1D5DB]"}`} />
                        8+ characters
                      </div>
                      <div className={`flex items-center gap-1.5 text-[11px] ${/[A-Z]/.test(newPassword) ? "text-[#10673E]" : "text-[#94A3B8]"}`}>
                        <div className={`h-1 w-1 rounded-full ${/[A-Z]/.test(newPassword) ? "bg-[#10673E]" : "bg-[#D1D5DB]"}`} />
                        Uppercase letter
                      </div>
                      <div className={`flex items-center gap-1.5 text-[11px] ${/[0-9]/.test(newPassword) ? "text-[#10673E]" : "text-[#94A3B8]"}`}>
                        <div className={`h-1 w-1 rounded-full ${/[0-9]/.test(newPassword) ? "bg-[#10673E]" : "bg-[#D1D5DB]"}`} />
                        Number
                      </div>
                      <div className={`flex items-center gap-1.5 text-[11px] ${/[^A-Za-z0-9]/.test(newPassword) ? "text-[#10673E]" : "text-[#94A3B8]"}`}>
                        <div className={`h-1 w-1 rounded-full ${/[^A-Za-z0-9]/.test(newPassword) ? "bg-[#10673E]" : "bg-[#D1D5DB]"}`} />
                        Special character
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                  <ShieldCheck size={13} className="text-[#6B7280]" />
                  Confirm New Password <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className={`h-11 w-full rounded-lg border bg-[#F9FAFB] px-4 pr-11 text-[13px] text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:ring-2 ${
                      confirmPassword && newPassword !== confirmPassword
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
                        : confirmPassword && newPassword === confirmPassword
                          ? "border-[#10673E] focus:border-[#10673E] focus:ring-[#10673E]/15"
                          : "border-[#D1D5DB] focus:border-[#10673E] focus:ring-[#10673E]/15"
                    } focus:bg-white`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors hover:text-[#64748B]"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#DC2626]">
                    <AlertTriangle size={12} />
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#10673E]">
                    <CheckCircle2 size={12} />
                    Passwords match
                  </p>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#FAFBFC] px-6 py-4">
              <p className="text-[12px] text-[#94A3B8]">
                Password must be at least 8 characters
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F9FAFB] hover:text-[#374151]"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-[#10673E] px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-[#10673E] disabled:hover:shadow-sm disabled:active:scale-100"
                >
                  <KeyRound size={15} className={submitting ? "animate-spin" : ""} />
                  {submitting ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* SECURITY TIPS */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2D5597]/10 text-[#2D5597]">
              <ShieldCheck size={14} />
            </div>
            <h2 className="text-[14px] font-bold text-[#1F2937]">
              Security Tips
            </h2>
          </div>
          <div className="p-5">
            <ul className="space-y-3">
              {[
                "Use at least 8 characters with a mix of letters, numbers, and symbols.",
                "Never share your password with anyone or write it down."
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#4B5563]">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#10673E]" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
