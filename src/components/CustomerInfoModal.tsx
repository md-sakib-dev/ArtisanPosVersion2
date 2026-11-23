import { useState } from "react";
import { X, User, Smartphone, Mail, MapPin, Percent, Send, KeyRound, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import type { RegularSaleCustomer } from "../api/customerApi";
import {
  isDiscountCodeAccepted,
  sendDiscountCode,
  verifyDiscountCode,
} from "../api/regularSaleApi";

// ======================================================
// TYPES
// ======================================================

interface CustomerInfoModalProps {
  open: boolean;
  onClose: () => void;
  customer: RegularSaleCustomer | null;
  /** Fired with the customer's percentage once the SMS code is verified. */
  onDiscountApplied: (discountPercent: number) => void;
}

// ======================================================
// CUSTOMER INFO MODAL
// ======================================================

export default function CustomerInfoModal({
  open,
  onClose,
  customer,
  onDiscountApplied,
}: CustomerInfoModalProps) {
  // ====================================================
  // STATE
  // ====================================================

  const [verifyCode, setVerifyCode] = useState<string>("");
  const [isCodeSent, setIsCodeSent] = useState<boolean>(false);
  const [isDiscountApplied, setIsDiscountApplied] = useState<boolean>(false);
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // ====================================================
  // FETCHED CUSTOMER DATA (from /RegularSales/customer/{phone})
  // ====================================================

  const customerName = customer?.customerName ?? "";
  const mobileNumber = customer?.mobileNumber ?? "";
  const emailAddress = customer?.emailAddress ?? "";
  const presentAddress = customer?.presentAddress ?? "";

  /* The percentage that gets handed to the sale once the code is verified. */
  const discountPercent = Number(customer?.discount) || 0;
  const discount = customer?.discount != null ? `${customer.discount}%` : "-";

  // ====================================================
  // HANDLERS
  // ====================================================

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* POST /api/RegularSales/discount/send-code — body { mobileNumber }. */
  const handleRequestDiscount = async () => {
    if (isSendingCode) return;

    if (!mobileNumber.trim()) {
      showToast("This customer has no mobile number on file.", "error");
      return;
    }

    setIsSendingCode(true);

    try {
      const result = await sendDiscountCode(mobileNumber.trim());

      if (!isDiscountCodeAccepted(result)) {
        showToast(
          result?.message || "Unable to send the verification code.",
          "error"
        );
        return;
      }

      setIsCodeSent(true);
      showToast(
        result.message || "Verification code sent to customer phone",
        "success"
      );
    } catch (error) {
      console.error("Send discount code error:", error);
      showToast("Unable to send the verification code.", "error");
    } finally {
      setIsSendingCode(false);
    }
  };

  /* POST /api/RegularSales/discount/verify-code — body { mobileNumber,
     verificationCode }. On success the customer's percentage is pushed to
     the sale and the modal closes. */
  const handleApplyDiscount = async () => {
    if (isVerifying) return;

    if (!verifyCode || verifyCode.length < 4) {
      showToast("Please enter a valid verification code", "error");
      return;
    }

    setIsVerifying(true);

    try {
      const result = await verifyDiscountCode(
        mobileNumber.trim(),
        verifyCode.trim()
      );

      if (!isDiscountCodeAccepted(result)) {
        showToast(
          result?.message || "Invalid verification code.",
          "error"
        );
        return;
      }

      setIsDiscountApplied(true);
      onDiscountApplied(discountPercent);
      onClose();
    } catch (error) {
      console.error("Verify discount code error:", error);
      showToast("Unable to verify the code.", "error");
    } finally {
      setIsVerifying(false);
    }
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
            <div
              className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                toast.type === "error"
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-green-200 bg-green-50 text-green-600"
              }`}
            >
              {toast.type === "error" ? (
                <AlertTriangle size={16} />
              ) : (
                <CheckCircle size={16} />
              )}
              {toast.message}
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

            {/* Mobile Number */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                <Smartphone size={14} className="text-[#10673E]" />
                Mobile Number
              </label>
              <input
                type="text"
                value={mobileNumber}
                readOnly
                className="h-10 w-full rounded-lg border border-[#DDE5DF] bg-[#F3F4F2] px-3 text-sm font-medium text-[#17231D] outline-none"
              />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            {/* Email Address */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                <Mail size={14} className="text-[#10673E]" />
                Email
              </label>
              <input
                type="text"
                value={emailAddress}
                readOnly
                className="h-10 w-full rounded-lg border border-[#DDE5DF] bg-[#F3F4F2] px-3 text-sm font-medium text-[#17231D] outline-none"
              />
            </div>

            {/* Present Address */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#66736B]">
                <MapPin size={14} className="text-[#10673E]" />
                Present Address
              </label>
              <input
                type="text"
                value={presentAddress}
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
              disabled={isCodeSent || isSendingCode}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] ${
                isCodeSent || isSendingCode
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#0E9351] text-white hover:bg-[#10673E] hover:shadow-md"
              }`}
            >
              {isSendingCode ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {isSendingCode
                ? "Sending..."
                : isCodeSent
                  ? "Code Sent"
                  : "Request Discount"}
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
              disabled={!isCodeSent || isDiscountApplied || isVerifying}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] ${
                !isCodeSent || isDiscountApplied || isVerifying
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#0E9351] text-white hover:bg-[#10673E] hover:shadow-md"
              }`}
            >
              {isVerifying && <Loader2 size={14} className="animate-spin" />}
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
