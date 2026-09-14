import { useState } from "react";
import { X, User, Calendar, Percent, Send, KeyRound, CheckCircle } from "lucide-react";

// ======================================================
// TYPES
// ======================================================

interface CustomerInfoModalProps {
  open: boolean;
  onClose: () => void;
}

// ======================================================
// CUSTOMER INFO MODAL
// ======================================================

export default function CustomerInfoModal({
  open,
  onClose,
}: CustomerInfoModalProps) {
  // ====================================================
  // STATE
  // ====================================================

  const [verifyCode, setVerifyCode] = useState<string>("");
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [isDiscountApplied, setIsDiscountApplied] = useState<boolean>(false);
  const [toast, setToast] = useState<string>("");

  // ====================================================
  // MOCK DATA (would come from API in real app)
  // ====================================================

  const customerName = "John Doe";
  const dateOfBirth = "1990-05-15";
  const discount = "10%";

  // ====================================================
  // HANDLERS
  // ====================================================

  const handleRequestDiscount = () => {
    setIsCodeSent(true);
    setToast("Verification code sent to customer phone");
    setTimeout(() => setToast(""), 3000);
  };

  const handleApplyDiscount = () => {
    if (!verifyCode || verifyCode.length < 4) {
      setToast("Please enter a valid verification code");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    setIsDiscountApplied(true);
    setToast("Discount applied successfully!");
    setTimeout(() => setToast(""), 3000);
  };

  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "").slice(0, 6);
    setVerifyCode(numericValue);
  };

  // ====================================================
  // RENDER
  // ====================================================

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[3px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#DDE5DF] bg-white shadow-2xl"
        style={{ animation: "fade-up 0.3s ease both" }}
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-center justify-between border-b border-[#E6EAE3] bg-gradient-to-r from-[#10673E] to-[#0D5A35] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <User size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Customer Info</h2>
              <p className="mt-0.5 text-xs text-white/70">
                Customer details and discount verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* ================================================= */}
        {/* BODY */}
        {/* ================================================= */}

        <div className="p-6">
          {/* Toast Message */}
          {toast && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
              <CheckCircle size={16} />
              {toast}
            </div>
          )}

          {/* Readonly Fields */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                <User size={14} className="text-[#10673E]" />
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                readOnly
                className="h-10 w-full rounded-lg border border-[#DDE5DF] bg-[#F3F4F2] px-3 text-sm font-medium text-[#17231D] outline-none"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                <Calendar size={14} className="text-[#10673E]" />
                Date of Birth
              </label>
              <input
                type="text"
                value={dateOfBirth}
                readOnly
                className="h-10 w-full rounded-lg border border-[#DDE5DF] bg-[#F3F4F2] px-3 text-sm font-medium text-[#17231D] outline-none"
              />
            </div>
          </div>

          {/* Discount Field */}
          <div className="mb-5">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#66736B]">
              <Percent size={14} className="text-[#10673E]" />
              Discount
            </label>
            <input
              type="text"
              value={discount}
              readOnly
              className="h-10 w-full rounded-lg border border-[#DDE5DF] bg-[#F3F4F2] px-3 text-sm font-semibold text-[#10673E] outline-none"
            />
          </div>

          {/* Divider */}
          <div className="mb-5 border-t border-[#E6EAE3]" />

          {/* Discount Request Button */}
          <div className="mb-4">
            <button
              type="button"
              onClick={handleRequestDiscount}
              disabled={isCodeSent}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] ${
                isCodeSent
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#0E9351] text-white hover:bg-[#10673E] hover:shadow-md"
              }`}
            >
              <Send size={14} />
              {isCodeSent ? "Code Sent" : "Request Discount"}
            </button>
            {isCodeSent && (
              <p className="mt-2 text-xs text-[#66736B]">
                A verification code has been sent to the customer's phone
              </p>
            )}
          </div>

          {/* Verify Code Field + Apply Button */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                <KeyRound size={14} className="text-[#10673E]" />
                Enter Verify Code
              </label>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="Enter code"
                maxLength={6}
                disabled={!isCodeSent}
                className="h-10 w-full rounded-lg border border-[#DDE5DF] bg-white px-3 text-sm font-medium tracking-widest text-[#17231D] outline-none transition-all placeholder:text-[#9AA29C] placeholder:tracking-normal focus:border-[#0E9351] focus:ring-2 focus:ring-[#0E9351]/15 disabled:bg-[#F3F4F2] disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyDiscount}
              disabled={!isCodeSent || isDiscountApplied}
              className={`h-10 rounded-lg px-5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] ${
                !isCodeSent || isDiscountApplied
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#0E9351] text-white hover:bg-[#10673E] hover:shadow-md"
              }`}
            >
              {isDiscountApplied ? "Applied" : "Apply Discount"}
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <div className="flex items-center justify-end border-t border-[#E6EAE3] bg-[#FAFBF9] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DDE5DF] bg-white px-5 text-sm font-medium text-[#66736B] transition-all hover:border-[#0E9351] hover:bg-[#F1F8F3] hover:text-[#10673E] active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
