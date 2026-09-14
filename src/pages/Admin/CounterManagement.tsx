import { useState, useMemo, useRef } from "react";
import {
  Monitor,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  Globe,
  Hash,
  Wifi,
} from "lucide-react";

// ======================================================
// TYPES
// ======================================================

interface Counter {
  id: number;
  counterNo: string;
  ipAddress: string;
  macAddress: string;
  status: "Active" | "Inactive";
}

// ======================================================
// INITIAL DATA
// ======================================================

const INITIAL_DATA: Counter[] = [
  { id: 1, counterNo: "1", ipAddress: "192.168.1.101", macAddress: "00:1A:2B:3C:4D:5E", status: "Active" },
  { id: 2, counterNo: "2", ipAddress: "192.168.1.102", macAddress: "00:1A:2B:3C:4D:5F", status: "Active" },
  { id: 3, counterNo: "3", ipAddress: "192.168.1.103", macAddress: "00:1A:2B:3C:4D:60", status: "Inactive" },
  { id: 4, counterNo: "4", ipAddress: "192.168.1.104", macAddress: "00:1A:2B:3C:4D:61", status: "Active" },
];

const EMPTY_FORM = {
  counterNo: "",
  ipAddress: "",
  macAddress: "",
  status: "Active" as "Active" | "Inactive",
};

const COUNTER_OPTIONS = Array.from({ length: 10 }, (_, i) => String(i + 1));

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
      {type === "success" ? <Check size={18} /> : <X size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-[#94A3B8] hover:text-[#64748B]">
        <X size={14} />
      </button>
    </div>
  );
}

// ======================================================
// PAGE
// ======================================================

export default function CounterManagement() {
  const [data, setData] = useState<Counter[]>(INITIAL_DATA);
  const [nextId, setNextId] = useState(5);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.counterNo.toLowerCase().includes(term) ||
        item.ipAddress.toLowerCase().includes(term) ||
        item.macAddress.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.counterNo) {
      setToast({ message: "Please select a counter number", type: "error" });
      return;
    }
    if (!form.ipAddress.trim()) {
      setToast({ message: "IP address is required", type: "error" });
      return;
    }
    if (!form.macAddress.trim()) {
      setToast({ message: "MAC address is required", type: "error" });
      return;
    }

    const duplicate = data.find(
      (item) => item.counterNo === form.counterNo && item.id !== editingId
    );
    if (duplicate) {
      setToast({ message: `Counter ${form.counterNo} already exists`, type: "error" });
      return;
    }

    if (editingId !== null) {
      setData((prev) =>
        prev.map((item) => (item.id === editingId ? { ...item, ...form } : item))
      );
      setToast({ message: "Counter updated successfully", type: "success" });
    } else {
      setData((prev) => [...prev, { id: nextId, ...form }]);
      setNextId((p) => p + 1);
      setToast({ message: "Counter added successfully", type: "success" });
    }
    resetForm();
  };

  const handleEdit = (item: Counter) => {
    setForm({
      counterNo: item.counterNo,
      ipAddress: item.ipAddress,
      macAddress: item.macAddress,
      status: item.status,
    });
    setEditingId(item.id);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    setToast({ message: "Counter deleted", type: "success" });
    if (editingId === id) resetForm();
  };

  const handleToggleStatus = (id: number) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" } : item
      )
    );
  };

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-[#F5F7F3]">
      <div className="mx-auto max-w-[1440px] space-y-5 p-4 lg:p-6" style={{ animation: "fade-up 0.4s ease both" }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* HEADER */}
        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <Monitor size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">Counter Management</h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">Configure POS counter devices, IPs, and MAC addresses</p>
            </div>
          </div>
        </header>

        {/* ====================================================== */}
        {/* TOP FORM                                                 */}
        {/* ====================================================== */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
              {editingId !== null ? <Pencil size={14} /> : <Plus size={14} />}
            </div>
            <h2 className="text-[14px] font-bold text-[#1F2937]">
              {editingId !== null ? "Update Counter" : "Add New Counter"}
            </h2>
            {editingId !== null && (
              <span className="rounded-md bg-[#F59E0B]/10 px-2 py-0.5 text-[11px] font-semibold text-[#D97706]">Edit Mode</span>
            )}
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Counter No */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                  <Hash size={13} className="text-[#6B7280]" />
                  Counter No <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={form.counterNo}
                  onChange={(e) => setForm((prev) => ({ ...prev, counterNo: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                >
                  <option value="">Select Counter</option>
                  {COUNTER_OPTIONS.map((n) => (
                    <option key={n} value={n}>Counter {n}</option>
                  ))}
                </select>
              </div>

              {/* IP Address */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                  <Globe size={13} className="text-[#6B7280]" />
                  Counter IP Address <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={form.ipAddress}
                  onChange={(e) => setForm((prev) => ({ ...prev, ipAddress: e.target.value }))}
                  placeholder="192.168.1.100"
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                />
              </div>

              {/* MAC Address */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                  <Wifi size={13} className="text-[#6B7280]" />
                  MAC Address <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={form.macAddress}
                  onChange={(e) => setForm((prev) => ({ ...prev, macAddress: e.target.value }))}
                  placeholder="00:1A:2B:3C:4D:5E"
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#374151]">
                  <Monitor size={13} className="text-[#6B7280]" />
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as "Active" | "Inactive" }))}
                  className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#1F2937] outline-none transition-colors focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={handleSubmit}
                className="flex h-10 items-center gap-2 rounded-lg bg-[#10673E] px-6 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md active:scale-[0.98]"
              >
                {editingId !== null ? <><Check size={15} /> Update Counter</> : <><Plus size={15} /> Save Counter</>}
              </button>
              <button
                onClick={resetForm}
                className="flex h-10 items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 text-[13px] font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB] hover:text-[#374151]"
              >
                <X size={14} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* BOTTOM TABLE                                              */}
        {/* ====================================================== */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-bold text-[#1F2937]">Counter List</h2>
              <span className="rounded-md bg-[#10673E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#10673E]">
                {filteredData.length} counters
              </span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search counters..."
                className="h-9 w-full rounded-lg border border-[#D1D5DB] bg-white pl-9 pr-3 text-[13px] text-[#1F2937] outline-none placeholder:text-[#9CA3AF] focus:border-[#10673E] focus:ring-2 focus:ring-[#10673E]/15 sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">SL</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Counter No</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Counter IP</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">MAC Address</th>
                  <th className="px-5 py-3 font-semibold text-[#6B7280]">Status</th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                        <Monitor size={30} strokeWidth={1.5} />
                        <p className="mt-2 text-[13px] font-medium">No counters found</p>
                        <p className="mt-1 text-[12px]">{searchTerm ? "Try a different search term" : "Add a new counter above"}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
                    <tr key={item.id} className="border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC]">
                      <td className="px-5 py-3 text-[#94A3B8]">{index + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#10673E]/10 text-[#10673E]">
                            <Monitor size={13} />
                          </div>
                          <span className="font-semibold text-[#1F2937]">Counter {item.counterNo}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <code className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[12px] font-medium text-[#475569]">{item.ipAddress}</code>
                      </td>
                      <td className="px-5 py-3">
                        <code className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[12px] font-medium text-[#475569]">{item.macAddress}</code>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            item.status === "Active"
                              ? "bg-[#10673E]/10 text-[#10673E] hover:bg-[#10673E]/15"
                              : "bg-[#F1F5F9] text-[#94A3B8] hover:bg-[#E2E8F0]"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${item.status === "Active" ? "bg-[#10673E]" : "bg-[#CBD5E1]"}`} />
                          {item.status}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(item)} className="flex h-7 w-7 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-[#E8F5ED] hover:text-[#10673E]" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#FEE2E2] hover:text-[#DC2626]" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredData.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#FAFBFC] px-5 py-3">
              <p className="text-[12px] text-[#94A3B8]">Showing {filteredData.length} of {data.length} counters</p>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[#94A3B8]">Active:</span>
                <span className="font-semibold text-[#10673E]">{filteredData.filter((i) => i.status === "Active").length}</span>
                <span className="mx-1 text-[#E5E7EB]">|</span>
                <span className="text-[#94A3B8]">Inactive:</span>
                <span className="font-semibold text-[#94A3B8]">{filteredData.filter((i) => i.status === "Inactive").length}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
