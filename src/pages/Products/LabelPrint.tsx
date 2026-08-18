import { useState, useRef, useEffect } from "react";
import {
  ScanBarcode,
  Search,
  Printer,
  Tags,
  X,
  FileOutput,
  CheckCircle2,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Mock product data                                                     */
/* ------------------------------------------------------------------ */

interface Product {
  id: string;
  barcode: string;
  name: string;
  sku: string;
  group: string;
  type: string;
  category: string;
  brand: string;
  size: string;
  color: string;
  price: number;
}

const MOCK_PRODUCTS: Product[] = [
  { id: "P001", barcode: "8901234567890", name: "Premium Panjabi", sku: "ETH-PJ01", group: "Apparel", type: "Ethnic", category: "Ethnic Wear", brand: "Artisan", size: "L", color: "White", price: 2499 },
  { id: "P002", barcode: "8901234567891", name: "Classic Denim Jeans", sku: "MEN-DJ4", group: "Apparel", type: "Bottoms", category: "Men's Wear", brand: "DenimCo", size: "32", color: "Blue", price: 1899 },
  { id: "P003", barcode: "8901234567892", name: "Cotton Polo Shirt", sku: "MEN-PL3", group: "Apparel", type: "Tops", category: "Men's Wear", brand: "CottonHouse", size: "M", color: "Navy", price: 899 },
  { id: "P004", barcode: "8901234567893", name: "Embroidered Kurti", sku: "WOM-KU2", group: "Apparel", type: "Ethnic", category: "Women's Wear", brand: "Artisan", size: "M", color: "Red", price: 1599 },
  { id: "P005", barcode: "8901234567894", name: "Running Sneakers", sku: "FTW-RS7", group: "Footwear", type: "Sports", category: "Footwear", brand: "StepMax", size: "42", color: "Black", price: 2999 },
  { id: "P006", barcode: "8901234567895", name: "Silk Saree", sku: "ETH-SS1", group: "Apparel", type: "Ethnic", category: "Ethnic Wear", brand: "SilkLine", size: "Free", color: "Gold", price: 4999 },
  { id: "P007", barcode: "8901234567896", name: "Kids T-Shirt", sku: "KID-TS1", group: "Apparel", type: "Tops", category: "Kids", brand: "JuniorWear", size: "6-8Y", color: "Yellow", price: 599 },
  { id: "P008", barcode: "8901234567897", name: "Formal Trousers", sku: "MEN-TR2", group: "Apparel", type: "Bottoms", category: "Men's Wear", brand: "TailorMade", size: "34", color: "Gray", price: 1299 },
];

/* ------------------------------------------------------------------ */
/* Toast                                                                 */
/* ------------------------------------------------------------------ */

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${
        type === "success" ? "border-[#10673E]/20 bg-white text-[#10673E]" : "border-red-200 bg-white text-red-600"
      }`}
      style={{ animation: "fade-up 0.3s ease both" }}
    >
      {type === "success" ? <CheckCircle2 size={18} /> : <X size={18} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-[#94A3B8] hover:text-[#64748B]"><X size={14} /></button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Label Preview                                                         */
/* ------------------------------------------------------------------ */

function LabelPreview({ product, qty }: { product: Product; qty: number }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-[#1F2937]">Label Preview</h3>
        <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-semibold text-[#64748B]">
          {qty} label{qty !== 1 ? "s" : ""}
        </span>
      </div>

      {/* BsTi Label Format */}
      <div className="flex justify-center">
        <div
          className="border border-dashed border-[#D1D5DB] bg-[#FAFBFC] p-4"
          style={{ width: "320px", minHeight: "180px" }}
        >
          {/* Label Header */}
          <div className="border-b border-[#E5E7EB] pb-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#10673E]">Wstech POS</p>
            <p className="text-[9px] text-[#94A3B8]">Dhanmondi Flagship</p>
          </div>

          {/* Product Info */}
          <div className="mt-2 text-center">
            <p className="text-[13px] font-bold text-[#1F2937] leading-tight">{product.name}</p>
            <p className="mt-0.5 text-[10px] text-[#6B7280]">{product.brand} · {product.category}</p>
          </div>

          {/* Details grid */}
          <div className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1 text-[9px]">
            <div className="text-[#94A3B8]">SKU</div>
            <div className="text-center font-medium text-[#1F2937]">{product.sku}</div>
            <div className="text-right text-[#94A3B8]">Size</div>
            <div className="text-[#94A3B8]">Color</div>
            <div className="text-center font-medium text-[#1F2937]">{product.color}</div>
            <div className="text-right font-medium text-[#1F2937]">{product.size}</div>
          </div>

          {/* Barcode area */}
          <div className="mt-3 flex flex-col items-center">
            <div className="flex items-end gap-[1px]">
              {Array.from({ length: 40 }, (_, i) => (
                <div
                  key={i}
                  className="bg-[#1F2937]"
                  style={{
                    width: i % 5 === 0 ? "2px" : "1px",
                    height: `${18 + (i % 3) * 2}px`,
                  }}
                />
              ))}
            </div>
            <p className="mt-1 font-mono text-[10px] font-medium text-[#1F2937] tracking-wider">{product.barcode}</p>
          </div>

          {/* Price */}
          <div className="mt-2 border-t border-[#E5E7EB] pt-1.5 text-center">
            <p className="text-[16px] font-bold text-[#10673E]">৳{new Intl.NumberFormat("en-IN").format(product.price)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function LabelPrint() {
  const [barcode, setBarcode] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalQuery, setModalQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  /* Focus barcode on mount */
  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  /* Close modal on outside click */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowModal(false);
      }
    };
    if (showModal) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showModal]);

  /* Barcode lookup */
  const handleBarcodeLookup = (code: string) => {
    const found = MOCK_PRODUCTS.find((p) => p.barcode === code || p.sku === code);
    if (found) {
      setSelectedProduct(found);
      setQty(1);
    } else {
      setToast({ message: "Product not found for this barcode", type: "error" });
    }
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBarcodeLookup(barcode);
    }
  };

  /* Search modal filter */
  const filtered = modalQuery.length < 1
    ? MOCK_PRODUCTS
    : MOCK_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(modalQuery.toLowerCase()) ||
          p.barcode.includes(modalQuery) ||
          p.sku.toLowerCase().includes(modalQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(modalQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(modalQuery.toLowerCase())
      );

  /* Select from modal */
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setBarcode(product.barcode);
    setQty(1);
    setShowModal(false);
    setModalQuery("");
  };

  /* Generate labels */
  const handleGenerate = () => {
    if (!selectedProduct) {
      setToast({ message: "Please select a product first", type: "error" });
      return;
    }
    setToast({ message: `${qty} label${qty !== 1 ? "s" : ""} generated for "${selectedProduct.name}"`, type: "success" });
  };

  /* BsTi Label print */
  const handleBsTiPrint = () => {
    if (!selectedProduct) {
      setToast({ message: "Please select a product first", type: "error" });
      return;
    }
    setToast({ message: `BsTi label sent to printer for "${selectedProduct.name}"`, type: "success" });
  };

  /* Clear */
  const handleClear = () => {
    setBarcode("");
    setSelectedProduct(null);
    setQty(1);
    barcodeRef.current?.focus();
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F5F7F3]">
      <div
        className="mx-auto max-w-[1200px] space-y-5 p-4 lg:p-6"
        style={{ animation: "fade-up 0.4s ease both" }}
      >
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* -------- Header -------- */}
        <header>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10673E]/10 text-[#10673E]">
              <Tags size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1F2937] md:text-2xl">
                Label Print
              </h1>
              <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                Generate product barcode labels for printing
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* -------- Left: Controls -------- */}
          <div className="space-y-5">
            {/* Barcode Input Card */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <ScanBarcode size={16} className="text-[#10673E]" />
                <h2 className="text-[14px] font-bold text-[#1F2937]">Barcode Lookup</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <ScanBarcode size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    ref={barcodeRef}
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="Scan or type barcode / SKU"
                    className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] py-2.5 pl-10 pr-4 text-[13px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20 font-mono"
                  />
                </div>
                <button
                  onClick={() => handleBarcodeLookup(barcode)}
                  className="flex items-center gap-2 rounded-lg bg-[#10673E] px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md"
                >
                  <Search size={15} />
                  Lookup
                </button>
              </div>

              {/* Selected product info */}
              {selectedProduct && (
                <div className="mt-4 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#10673E]/10 text-[#10673E] text-[11px] font-bold">
                        {selectedProduct.sku}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#1F2937]">{selectedProduct.name}</p>
                        <p className="text-[11.5px] text-[#94A3B8]">{selectedProduct.brand} · {selectedProduct.category} · {selectedProduct.size} · {selectedProduct.color}</p>
                        <p className="mt-0.5 text-[13px] font-bold text-[#10673E]">৳{new Intl.NumberFormat("en-IN").format(selectedProduct.price)}</p>
                      </div>
                    </div>
                    <button onClick={handleClear} className="text-[#94A3B8] hover:text-[#64748B] transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Search Product button */}
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#D1D5DB] bg-[#FAFBFC] py-2.5 text-[13px] font-medium text-[#6B7280] transition-all hover:border-[#10673E]/40 hover:bg-[#F1F8F3] hover:text-[#10673E]"
              >
                <Search size={15} />
                Search Product
              </button>
            </div>

            {/* Quantity & Actions */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <FileOutput size={16} className="text-[#10673E]" />
                <h2 className="text-[14px] font-bold text-[#1F2937]">Print Settings</h2>
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <label className="mb-1.5 block text-[12.5px] font-medium text-[#374151]">Number of Labels</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] text-[#6B7280] transition-colors hover:bg-[#F1F5F9]"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-10 w-20 rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] text-center text-[14px] font-bold text-[#1F2937] tabular-nums focus:border-[#10673E] focus:outline-none focus:ring-2 focus:ring-[#10673E]/20"
                  />
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] text-[#6B7280] transition-colors hover:bg-[#F1F5F9]"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={!selectedProduct}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#10673E] py-3 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0D5A35] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <Printer size={16} />
                  Generate Label
                </button>
                <button
                  onClick={handleBsTiPrint}
                  disabled={!selectedProduct}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-[#10673E] bg-white py-3 text-[13px] font-semibold text-[#10673E] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E8F5ED] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <Tags size={16} />
                  BsTi Label
                </button>
              </div>
              <button
                onClick={handleClear}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] bg-white py-2.5 text-[13px] font-medium text-[#6B7280] transition-all hover:bg-[#F9FAFB] hover:text-[#374151]"
              >
                <RotateCcw size={15} />
                Clear & Reset
              </button>
            </div>
          </div>

          {/* -------- Right: Label Preview -------- */}
          <div>
            {selectedProduct ? (
              <LabelPreview product={selectedProduct} qty={qty} />
            ) : (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-[#D1D5DB] bg-white">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F5F9]">
                    <Tags size={24} className="text-[#94A3B8]" />
                  </div>
                  <p className="mt-3 text-[13px] font-medium text-[#6B7280]">No product selected</p>
                  <p className="mt-1 text-[12px] text-[#94A3B8]">Scan a barcode or search for a product</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* -------- Search Product Modal -------- */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" style={{ animation: "fade-up 0.2s ease both" }}>
            <div ref={modalRef} className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-[#10673E]" />
                  <h2 className="text-[15px] font-bold text-[#1F2937]">Search & Select Product</h2>
                </div>
                <button onClick={() => { setShowModal(false); setModalQuery(""); }} className="text-[#94A3B8] hover:text-[#64748B] transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Search bar */}
              <div className="border-b border-[#E5E7EB] px-5 py-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    autoFocus
                    type="text"
                    value={modalQuery}
                    onChange={(e) => setModalQuery(e.target.value)}
                    placeholder="Search by name, barcode, SKU, category, or brand..."
                    className="w-full rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] py-2.5 pl-10 pr-4 text-[13px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:border-[#10673E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10673E]/20"
                  />
                </div>
              </div>

              {/* Results table */}
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="px-5 py-2.5 text-[11px] font-semibold text-[#6B7280]">Barcode</th>
                      <th className="px-5 py-2.5 text-[11px] font-semibold text-[#6B7280]">Product</th>
                      <th className="px-5 py-2.5 text-[11px] font-semibold text-[#6B7280]">SKU</th>
                      <th className="px-5 py-2.5 text-[11px] font-semibold text-[#6B7280]">Category</th>
                      <th className="px-5 py-2.5 text-[11px] font-semibold text-[#6B7280]">Brand</th>
                      <th className="px-5 py-2.5 text-[11px] font-semibold text-[#6B7280]">Price</th>
                      <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-[#6B7280]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-[13px] text-[#94A3B8]">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p) => (
                        <tr key={p.id} className="transition-colors hover:bg-[#F1F8F3] cursor-pointer" onClick={() => handleSelectProduct(p)}>
                          <td className="px-5 py-3 font-mono text-[#374151] text-[12px]">{p.barcode}</td>
                          <td className="px-5 py-3 font-semibold text-[#1F2937]">{p.name}</td>
                          <td className="px-5 py-3 text-[#6B7280]">{p.sku}</td>
                          <td className="px-5 py-3 text-[#6B7280]">{p.category}</td>
                          <td className="px-5 py-3 text-[#6B7280]">{p.brand}</td>
                          <td className="px-5 py-3 font-semibold text-[#10673E] tabular-nums">৳{new Intl.NumberFormat("en-IN").format(p.price)}</td>
                          <td className="px-5 py-3 text-right">
                            <button className="inline-flex items-center gap-1 rounded-lg bg-[#10673E]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[#10673E] transition-colors hover:bg-[#10673E]/20">
                              Select
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-[#E5E7EB] px-5 py-3">
                <p className="text-[12px] text-[#94A3B8]">{filtered.length} product{filtered.length !== 1 ? "s" : ""} found</p>
                <button
                  onClick={() => { setShowModal(false); setModalQuery(""); }}
                  className="rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-[13px] font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
