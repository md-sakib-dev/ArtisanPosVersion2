import {
  ArrowLeftRight,
  Boxes,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Hash,
  Loader2,
  Package,
  Plus,
  Save,
  Search,
  Warehouse,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getCurrentStockByBarcode } from "../../api/currentStockApi";
import { getBranchDropdown } from "../../api/branchApi";
import { createStockTransfer } from "../../api/stockTransferApi";
import { useAuth } from "../../contexts/AuthContext";


// ======================================================
// TYPES
// ======================================================

interface StockProduct {
  productId: number;
  barcode: string;
  name: string;
  description: string;
  unit: string;
  stockQty: number;
}

interface TransferItem extends StockProduct {
  id: number;
  transferQty: number;
}

type Toast =
  | {
      message: string;
      type: "success" | "error";
    }
  | null;


// ======================================================
// STOCK TRANSFER (MAIN)
// ======================================================


// ======================================================
// REUSABLE STYLES
// ======================================================

const smallInputClass = `
  h-8
  w-full
  rounded-md
  border
  border-[#DDE5DF]
  bg-white
  px-2.5
  text-xs
  text-[#17231D]
  outline-none
  transition
  placeholder:text-[#9AA29C]
  focus:border-[#0E9351]
  focus:ring-2
  focus:ring-[#0E9351]/15
`;

const readOnlyInputClass = `
  h-8
  w-full
  rounded-md
  border
  border-[#E3E7E0]
  bg-[#F6F8F5]
  px-2.5
  text-xs
  font-medium
  text-[#66736B]
  outline-none
`;

const secondaryButtonClass = `
  inline-flex
  h-9
  items-center
  justify-center
  gap-1.5
  rounded-md
  border
  border-[#DDE5DF]
  bg-white
  px-3.5
  text-xs
  font-medium
  text-[#10673E]
  transition
  hover:border-[#0E9351]
  hover:bg-[#F1F8F3]
  active:scale-[0.98]
`;


// ======================================================
// FIELD
// ======================================================

interface FieldProps {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}

function Field({
  label,
  icon,
  children,
}: FieldProps) {

  return (
    <div className="min-w-0">

      <label className="
        mb-1
        flex
        items-center
        gap-1
        text-[10px]
        font-semibold
        text-[#66736B]
      ">

        {icon}

        {label}

      </label>

      {children}

    </div>
  );
}


// ======================================================
// VIEW CHALLAN MODAL
// ======================================================

interface ViewChallanModalProps {
  open: boolean;
  challanNo: string;
  transferTo: string;
  items: TransferItem[];
  onClose: () => void;
}

function ViewChallanModal({
  open,
  challanNo,
  transferTo,
  items,
  onClose,
}: ViewChallanModalProps) {

  if (!open) {
    return null;
  }

  const totalTransferQty = items.reduce(
    (total, item) =>
      total + item.transferQty,
    0
  );

  const today = new Date().toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        p-4
        backdrop-blur-[2px]
      "
      style={{
        animation: "st-fade 150ms ease-out",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >

      <div
        className="
          flex
          max-h-[80vh]
          w-full
          max-w-2xl
          flex-col
          overflow-hidden
          rounded-xl
          border
          border-[#DDE5DF]
          bg-white
          shadow-2xl
        "
        style={{
          animation: "st-pop 180ms ease-out",
        }}
      >

        {/* MODAL HEADER */}

        <div className="
          flex
          shrink-0
          items-center
          justify-between
          border-b
          border-[#E6EAE3]
          bg-[#F1F8F3]
          px-4
          py-3
        ">

          <div className="
            flex
            items-center
            gap-2
          ">

            <div className="
              flex
              h-7
              w-7
              items-center
              justify-center
              rounded-md
              bg-[#10673E]
              text-white
            ">
              <ClipboardList size={14} />
            </div>

            <div>

              <h2 className="
                text-sm
                font-semibold
                text-[#17231D]
              ">
                Transfer Challan
              </h2>

              <p className="
                text-[9px]
                text-[#66736B]
              ">
                {challanNo} · {today}
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-md
              p-1.5
              text-[#66736B]
              transition
              hover:bg-[#F1F8F3]
              hover:text-[#10673E]
            "
          >
            <X size={18} />
          </button>

        </div>


        {/* MODAL META STRIP */}

        <div className="
          flex
          shrink-0
          flex-wrap
          items-center
          gap-x-6
          gap-y-1
          border-b
          border-[#ECEFEA]
          bg-white
          px-4
          py-2
          text-[10px]
          text-[#66736B]
        ">

          <span>
            Transfer To:{" "}
            <b className="text-[#17231D]">
              {transferTo || "—"}
            </b>
          </span>

          <span>
            Total Items:{" "}
            <b className="text-[#17231D]">
              {items.length}
            </b>
          </span>

          <span>
            Total Qty:{" "}
            <b className="text-[#17231D]">
              {totalTransferQty}
            </b>
          </span>

        </div>


        {/* MODAL BODY */}

        <div className="
          min-h-0
          flex-1
          overflow-auto
        ">

          <table className="
            w-full
            min-w-[520px]
            border-collapse
            text-xs
          ">

            <thead className="
              sticky
              top-0
              z-10
              bg-[#10673E]
              text-white
            ">

              <tr>

                <th className="
                  px-3
                  py-2.5
                  text-center
                  text-[10px]
                  font-semibold
                ">
                  Sl No
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Barcode
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Product Name
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-center
                  text-[10px]
                  font-semibold
                ">
                  Transfer Qty
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-center
                  text-[10px]
                  font-semibold
                ">
                  Unit
                </th>

              </tr>

            </thead>

            <tbody>

              {items.map((item, index) => (

                <tr
                  key={item.id}
                  className="
                    border-b
                    border-[#ECEFEA]
                    transition-colors
                    hover:bg-[#F1F8F3]
                  "
                >

                  <td className="
                    px-3
                    py-2.5
                    text-center
                    tabular-nums
                    text-[#8A938B]
                  ">
                    {index + 1}
                  </td>

                  <td className="
                    px-3
                    py-2.5
                    font-mono
                    text-[11px]
                    text-[#66736B]
                  ">
                    {item.barcode}
                  </td>

                  <td className="
                    px-3
                    py-2.5
                    font-medium
                    text-[#17231D]
                  ">
                    {item.name}
                  </td>

                  <td className="
                    px-3
                    py-2.5
                    text-center
                    font-semibold
                    tabular-nums
                    text-[#10673E]
                  ">
                    {item.transferQty}
                  </td>

                  <td className="
                    px-3
                    py-2.5
                    text-center
                    text-[#66736B]
                  ">
                    {item.unit}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>


        {/* MODAL FOOTER */}

        <div className="
          flex
          shrink-0
          items-center
          justify-end
          gap-2
          border-t
          border-[#E6EAE3]
          bg-[#FAFBF9]
          px-4
          py-2.5
        ">

          <button
            type="button"
            onClick={onClose}
            className={secondaryButtonClass}
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}


// ======================================================
// STOCK TRANSFER (MAIN)
// ======================================================

function StockTransfer() {

  const { user } = useAuth();
  const myBranchId = user?.branchId ?? 0;

  // ====================================================
  // PRODUCT OUT TYPE DROPDOWN (placeholder options)
  // ====================================================

  const productOutTypeOptions = [
    { value: 1, text: "Branch Transfer" },
    { value: 2, text: "Warehouse Transfer" },
  ];

  // ====================================================
  // DESTINATION BRANCH DROPDOWN (from API, minus my own)
  // ====================================================

  interface BranchOption {
    value: number;
    text: string;
  }

  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadBranches = async () => {
      setBranchesLoading(true);

      try {
        const response = await getBranchDropdown();

        if (cancelled) return;

        /* Never offer the logged-in user's own branch as a
           transfer destination */
        setBranchOptions(
          (response.data ?? []).filter(
            (opt) => opt.value !== myBranchId
          )
        );
      } catch (error) {
        console.error("Failed to load branch dropdown:", error);
        if (!cancelled) setBranchOptions([]);
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    };

    loadBranches();

    return () => {
      cancelled = true;
    };
  }, [myBranchId]);

  // ====================================================
  // PRODUCT ENTRY STATE
  // ====================================================

  const [transferTo, setTransferTo] =
    useState<string>("");

  const [productOutType, setProductOutType] =
    useState<string>("");

  const [barcodeInput, setBarcodeInput] =
    useState("");

  const [transferQtyInput, setTransferQtyInput] =
    useState("1");

  const [foundProduct, setFoundProduct] =
    useState<StockProduct | null>(null);

  const [lookupLoading, setLookupLoading] =
    useState(false);

  const barcodeRef =
    useRef<HTMLInputElement>(null);


  // ====================================================
  // ITEMS STATE
  // ====================================================

  const [items, setItems] =
    useState<TransferItem[]>([]);

  const [nextId, setNextId] = useState(1);

  const [remarks, setRemarks] =
    useState("");


  // ====================================================
  // UI STATE
  // ====================================================

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [toast, setToast] = useState<Toast>(null);


  // ====================================================
  // TOAST
  // ====================================================

  const showToast = useCallback(
    (
      message: string,
      type: "success" | "error"
    ) => {

      setToast({ message, type });

      window.setTimeout(() => {
        setToast(null);
      }, 2600);
    },
    []
  );


  // ====================================================
  // BARCODE LOOKUP — GET /api/CurrentStocks/by-barcode/{barcode}
  // ====================================================

  const lookupBarcode = useCallback(
    async (rawBarcode: string): Promise<StockProduct | null> => {

      const barcode = rawBarcode.trim();

      if (!barcode) {
        setFoundProduct(null);
        return null;
      }

      setLookupLoading(true);

      try {
        const response = await getCurrentStockByBarcode(barcode);

        if (response.success && response.data) {
          const product: StockProduct = {
            productId: response.data.productId,
            barcode: response.data.barcode,
            name: response.data.fullName || response.data.shortName,
            description: response.data.shortName,
            unit: "Pcs",
            stockQty: response.data.quantity,
          };

          setFoundProduct(product);
          return product;
        }

        setFoundProduct(null);
        return null;
      } catch (error) {
        console.error("Barcode lookup failed:", error);
        setFoundProduct(null);
        return null;
      } finally {
        setLookupLoading(false);
      }
    },
    []
  );

  const handleBarcodeChange = (
    value: string
  ) => {

    setBarcodeInput(value);

    /* Clear the previous product while typing; the lookup runs on
       Enter (scan guns send Enter after the code). */
    setFoundProduct(null);
  };


  // ====================================================
  // SEARCH — fetch product by barcode + qty
  // ====================================================

  const handleSearch = async () => {

    if (!barcodeInput.trim()) {
      showToast(
        "Scan or type a barcode first",
        "error"
      );
      barcodeRef.current?.focus();
      return;
    }

    await lookupBarcode(barcodeInput);
  };


  // ====================================================
  // ADD ITEM — validates qty against fetched stock
  // ====================================================

  const handleAdd = () => {

    /* Add works only on a fetched product (Search must run first) */
    const product = foundProduct;

    if (!product) {
      showToast(
        "Search the product first",
        "error"
      );
      barcodeRef.current?.focus();
      return;
    }

    const quantity =
      Math.floor(Number(transferQtyInput) || 0);

    if (quantity <= 0) {
      showToast(
        "Transfer quantity must be greater than 0",
        "error"
      );
      return;
    }

    /* Product is only added when qty <= stock quantity */
    if (quantity > product.stockQty) {
      showToast(
        `Only ${product.stockQty} ${product.unit} in stock`,
        "error"
      );
      return;
    }

    setItems((previousItems) => {

      const existingIndex =
        previousItems.findIndex(
          (item) =>
            item.barcode === product.barcode
        );

      if (existingIndex !== -1) {

        const updatedItems = [
          ...previousItems,
        ];

        const existingItem =
          updatedItems[existingIndex];

        const combinedQty = Math.min(
          product.stockQty,
          existingItem.transferQty + quantity
        );

        updatedItems[existingIndex] = {
          ...existingItem,
          transferQty: combinedQty,
        };

        return updatedItems;
      }

      return [
        ...previousItems,
        {
          ...product,
          id: nextId,
          transferQty: quantity,
        },
      ];
    });

    setNextId((id) => id + 1);
    setBarcodeInput("");
    setTransferQtyInput("1");
    setFoundProduct(null);

    showToast(
      `${quantity} ${product.unit} staged for transfer`,
      "success"
    );

    barcodeRef.current?.focus();
  };


  // ====================================================
  // REMOVE ITEM
  // ====================================================

  const handleRemove = (id: number) => {

    setItems((previousItems) =>
      previousItems.filter(
        (item) => item.id !== id
      )
    );
  };


  // ====================================================
  // CALCULATIONS
  // ====================================================

  const totalTransferQty = items.reduce(
    (total, item) =>
      total + item.transferQty,
    0
  );


  // ====================================================
  // SAVE
  // ====================================================

  const handleSave = async () => {

    if (items.length === 0) {
      showToast(
        "No items staged for transfer",
        "error"
      );
      return;
    }

    if (!productOutType) {
      showToast(
        "Select a product out type first",
        "error"
      );
      return;
    }

    if (!transferTo) {
      showToast(
        "Select a transfer destination first",
        "error"
      );
      return;
    }

    if (!myBranchId) {
      showToast(
        "Your user has no branch assigned",
        "error"
      );
      return;
    }

    setIsSaving(true);

    try {
      const response = await createStockTransfer({
        master: {
          productOutType: productOutType,
          outFromBranchId: myBranchId,
          outToBranchId: Number(transferTo),
          outDate: new Date().toISOString(),
          remarks: remarks.trim(),
        },
        details: items.map((item) => ({
          productId: item.productId,
          barcode: item.barcode,
          sentQty: item.transferQty,
        })),
      });

      if (!response.success) {
        showToast(
          response.message || "Failed to save the transfer",
          "error"
        );
        return;
      }

      showToast(
        `Transfer saved — ${items.length} items (${totalTransferQty} units)`,
        "success"
      );

      setItems([]);
      setRemarks("");
      setTransferTo("");
      setProductOutType("");
    } catch (error) {
      console.error("Save transfer failed:", error);
      showToast(
        "Unable to reach the server. Please try again.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };


  // ====================================================
  // VIEW CHALLAN
  // ====================================================

  const handleViewChallan = () => {

    if (items.length === 0) {
      showToast(
        "Add items before viewing the challan",
        "error"
      );
      return;
    }

    setIsModalOpen(true);
  };


  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="
      flex
      h-full
      min-h-0
      w-full
      flex-col
      overflow-hidden
      bg-[#F5F7F3]
      text-[#17231D]
    ">

      <style>{`
        @keyframes st-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes st-pop {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>


      {/* ================================================= */}
      {/* PAGE HEADER */}
      {/* ================================================= */}

      <header className="
        flex
        shrink-0
        flex-wrap
        items-center
        justify-between
        gap-2
        border-b
        border-[#DDE5DF]
        bg-white
        px-[clamp(8px,1vw,16px)]
        py-2
        shadow-[0_1px_2px_rgba(35,42,35,0.06)]
      ">

        <div className="
          flex
          items-center
          gap-2
        ">

          <div className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-md
            bg-[#10673E]
            text-white
          ">
            <ArrowLeftRight size={16} />
          </div>

          <div>

            <h1 className="
              text-sm
              font-semibold
              leading-none
              text-[#17231D]
            ">
              Stock Transfer
            </h1>

            <p className="
              mt-0.5
              text-[9px]
              text-[#66736B]
            ">
              Transfer stock between
              branches &amp; warehouses
            </p>

          </div>

        </div>

        <span className="
          hidden
          items-center
          gap-1.5
          rounded-full
          bg-[#E8F5ED]
          px-2.5
          py-1
          text-[9px]
          font-semibold
          text-[#66736B]
          sm:inline-flex
        ">
          <ArrowLeftRight size={11} />
          {items.length} items staged
        </span>

      </header>


      {/* ================================================= */}
      {/* TRANSFER CONTROLS */}
      {/* ================================================= */}

      <section className="
        shrink-0
        border-b
        border-[#DDE5DF]
        bg-white
        px-[clamp(8px,1vw,16px)]
        py-2.5
      ">

        {/* ROW 1 — Out Type · Transfer To · Barcode · Qty · Search */}

        <div className="
          grid
          grid-cols-2
          gap-2
          md:grid-cols-4
          xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.55fr)_auto]
        ">

          <Field
            label="Product Out Type"
            icon={<Package size={13} />}
          >

            <select
              value={productOutType}
              onChange={(e) =>
                setProductOutType(e.target.value)
              }
              className={`
                ${smallInputClass}
                ${
                  productOutType
                    ? ""
                    : "text-[#9AA29C]"
                }
              `}
            >
              <option value="" disabled>
                Select out type
              </option>

              {productOutTypeOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.text}
                </option>
              ))}

            </select>

          </Field>

          <Field
            label="Transfer To"
            icon={<Warehouse size={13} />}
          >

            <select
              value={transferTo}
              onChange={(e) =>
                setTransferTo(e.target.value)
              }
              disabled={branchesLoading || branchOptions.length === 0}
              className={`
                ${smallInputClass}
                ${
                  transferTo
                    ? ""
                    : "text-[#9AA29C]"
                }
              `}
            >
              <option value="" disabled>
                {branchesLoading
                  ? "Loading branches..."
                  : branchOptions.length === 0
                    ? "No other branches available"
                    : "Select destination"}
              </option>

              {branchOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.text}
                </option>
              ))}

            </select>

          </Field>

          <Field
            label="Product Barcode"
            icon={<Hash size={13} />}
          >

            <input
              ref={barcodeRef}
              autoFocus
              value={barcodeInput}
              onChange={(e) =>
                handleBarcodeChange(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSearch();
                }
              }}
              className={`
                ${smallInputClass}
                font-mono
              `}
              placeholder="Scan or type barcode"
            />

          </Field>

          <Field
            label="Transfer Qty"
            icon={<ArrowLeftRight size={13} />}
          >

            <input
              type="number"
              min={1}
              value={transferQtyInput}
              onChange={(e) =>
                setTransferQtyInput(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSearch();
                }
              }}
              className={`
                ${smallInputClass}
                text-center
                tabular-nums
              `}
            />

          </Field>

          <div className="
            col-span-2
            flex
            items-end
            md:col-span-1
          ">

            <button
              type="button"
              onClick={() => void handleSearch()}
              disabled={lookupLoading}
              className="
                inline-flex
                h-8
                w-full
                items-center
                justify-center
                gap-1
                rounded-md
                border
                border-[#DDE5DF]
                bg-white
                px-4
                text-[10px]
                font-semibold
                text-[#10673E]
                transition
                hover:border-[#0E9351]
                hover:bg-[#F1F8F3]
                active:scale-[0.98]
                disabled:opacity-60
              "
            >
              {lookupLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Search size={13} />
              )}
              SEARCH
            </button>

          </div>

        </div>


        {/* ROW 2 — FETCHED PRODUCT INFO + ADD (populated by Search):
            Product Name · Description · Stock Qty · Add */}

        <div className="
          mt-2
          grid
          grid-cols-2
          gap-2
          md:grid-cols-4
          xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,0.6fr)_auto]
        ">

          <Field
            label="Product Name"
            icon={<Package size={13} />}
          >

            <input
              readOnly
              value={
                foundProduct?.name ??
                "—"
              }
              className={`
                ${readOnlyInputClass}
                ${
                  foundProduct
                    ? "text-[#17231D]"
                    : ""
                }
              `}
            />

          </Field>

          <Field
            label="Product Description"
            icon={<ClipboardList size={13} />}
          >

            <input
              readOnly
              value={
                foundProduct?.description ??
                "—"
              }
              className={readOnlyInputClass}
            />

          </Field>

          <Field
            label="Stock Qty"
            icon={<Boxes size={13} />}
          >

            <input
              readOnly
              value={
                foundProduct
                  ? `${foundProduct.stockQty} ${foundProduct.unit}`
                  : "—"
              }
              className={`
                ${readOnlyInputClass}
                text-center
                ${
                  foundProduct
                    ? "font-semibold text-[#10673E]"
                    : ""
                }
              `}
            />

          </Field>

          <div className="
            col-span-2
            flex
            items-end
            md:col-span-1
          ">

            <button
              type="button"
              onClick={handleAdd}
              disabled={!foundProduct}
              className="
                inline-flex
                h-8
                w-full
                items-center
                justify-center
                gap-1
                rounded-md
                bg-[#0E9351]
                px-4
                text-[10px]
                font-semibold
                text-white
                transition
                hover:bg-[#10673E]
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Plus size={13} />
              Add
            </button>

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* TRANSFER ITEMS TABLE */}
      {/* ================================================= */}

      <section className="
        flex
        min-h-0
        min-w-0
        flex-1
        flex-col
        overflow-hidden
        border-b
        border-[#DDE5DF]
        bg-white
      ">

        {/* TABLE HEADER STRIP */}

        <div className="
          flex
          h-9
          shrink-0
          items-center
          justify-between
          border-b
          border-[#DDE5DF]
          bg-[#F1F8F3]
          px-[clamp(8px,1vw,16px)]
        ">

          <div className="
            flex
            items-center
            gap-2
          ">

            <ArrowLeftRight
              size={14}
              className="text-[#10673E]"
            />

            <span className="
              text-xs
              font-semibold
              text-[#10673E]
            ">
              Transfer Items
            </span>

            <span className="
              rounded-full
              bg-[#E8F5ED]
              px-2
              py-0.5
              text-[9px]
              font-semibold
              text-[#66736B]
            ">
              {items.length}
            </span>

          </div>

          <span className="
            text-[10px]
            text-[#66736B]
          ">
            {totalTransferQty} units
          </span>

        </div>


        {/* TABLE SCROLL AREA */}

        <div className="
          min-h-0
          flex-1
          overflow-auto
        ">

          <table className="
            w-full
            min-w-[760px]
            border-collapse
            text-xs
          ">

            <thead className="
              sticky
              top-0
              z-10
              bg-[#10673E]
              text-white
            ">

              <tr>

                <th className="
                  px-3
                  py-2.5
                  text-center
                  text-[10px]
                  font-semibold
                ">
                  Sl No
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Product Barcode
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Product Name
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-center
                  text-[10px]
                  font-semibold
                ">
                  Current Stock
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-center
                  text-[10px]
                  font-semibold
                ">
                  Transfer Qty
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-center
                  text-[10px]
                  font-semibold
                ">
                  Unit
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-center
                  text-[10px]
                  font-semibold
                ">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {items.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="
                      py-14
                      text-center
                    "
                  >

                    <div className="
                      flex
                      flex-col
                      items-center
                      justify-center
                      text-[#9AA29C]
                    ">

                      <Boxes
                        size={30}
                        strokeWidth={1.5}
                      />

                      <p className="
                        mt-2
                        text-xs
                        font-medium
                      ">
                        No items staged for transfer
                      </p>

                      <p className="
                        mt-1
                        text-[10px]
                      ">
                        Scan a barcode and press
                        Add to stage items
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                items.map((item, index) => (

                  <tr
                    key={item.id}
                    className="
                      border-b
                      border-[#ECEFEA]
                      transition-colors
                      hover:bg-[#F1F8F3]
                    "
                  >

                    <td className="
                      px-3
                      py-2
                      text-center
                      tabular-nums
                      text-[#8A938B]
                    ">
                      {index + 1}
                    </td>

                    <td className="
                      px-3
                      py-2
                      font-mono
                      text-[11px]
                      text-[#66736B]
                    ">
                      {item.barcode}
                    </td>

                    <td className="
                      px-3
                      py-2
                      font-medium
                      text-[#17231D]
                    ">
                      {item.name}
                    </td>

                    <td className="
                      px-3
                      py-2
                      text-center
                      font-medium
                      tabular-nums
                      text-[#66736B]
                    ">
                      {item.stockQty}
                    </td>

                    <td className="
                      px-3
                      py-2
                      text-center
                      font-semibold
                      tabular-nums
                      text-[#10673E]
                    ">
                      {item.transferQty}
                    </td>

                    <td className="
                      px-3
                      py-2
                      text-center
                      text-[#66736B]
                    ">
                      {item.unit}
                    </td>

                    <td className="
                      px-3
                      py-2
                      text-center
                    ">

                      <button
                        type="button"
                        onClick={() =>
                          handleRemove(item.id)
                        }
                        title="Remove item"
                        className="
                          inline-flex
                          h-7
                          w-7
                          items-center
                          justify-center
                          rounded-md
                          text-[#B84A4A]
                          transition
                          hover:bg-[#FCECEC]
                        "
                      >
                        <X size={14} />
                      </button>

                    </td>

                  </tr>
                ))

              )}

            </tbody>

          </table>

        </div>

      </section>


      {/* ================================================= */}
      {/* BOTTOM ACTION SECTION */}
      {/* ================================================= */}

      <footer className="
        flex
        shrink-0
        flex-wrap
        items-end
        justify-between
        gap-2
        bg-white
        px-[clamp(8px,1vw,16px)]
        py-2.5
      ">

        {/* REMARKS */}

        <div className="
          min-w-0
          flex-1
        ">

          <label className="
            mb-1
            flex
            items-center
            gap-1
            text-[10px]
            font-semibold
            text-[#66736B]
          ">
            Remarks
          </label>

          <textarea
            value={remarks}
            onChange={(e) =>
              setRemarks(e.target.value)
            }
            rows={2}
            placeholder="Add dispatch notes (optional)"
            className="
              h-14
              w-full
              resize-none
              rounded-md
              border
              border-[#DDE5DF]
              bg-white
              px-2.5
              py-1.5
              text-xs
              text-[#17231D]
              outline-none
              transition
              placeholder:text-[#9AA29C]
              focus:border-[#0E9351]
              focus:ring-2
              focus:ring-[#0E9351]/15
            "
          />

        </div>


        {/* ACTION BUTTONS */}

        <div className="
          flex
          shrink-0
          items-end
          gap-1.5
        ">

          <button
            type="button"
            onClick={handleViewChallan}
            className="
              inline-flex
              h-14
              items-center
              justify-center
              gap-2
              rounded-md
              border
              border-[#DDE5DF]
              bg-white
              px-5
              text-xs
              font-semibold
              text-[#10673E]
              transition
              hover:border-[#0E9351]
              hover:bg-[#F1F8F3]
              active:scale-[0.98]
            "
          >
            <ClipboardList size={15} />
            View Challan
          </button>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="
              inline-flex
              h-14
              items-center
              justify-center
              gap-2
              rounded-md
              bg-[#0E9351]
              px-7
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-[#10673E]
              active:scale-[0.99]
              disabled:opacity-60
            "
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save
          </button>

        </div>

      </footer>


      {/* ================================================= */}
      {/* VIEW CHALLAN MODAL */}
      {/* ================================================= */}

      <ViewChallanModal
        open={isModalOpen}
        challanNo="ST-2026-0001"
        transferTo={transferTo}
        items={items}
        onClose={() =>
          setIsModalOpen(false)
        }
      />


      {/* ================================================= */}
      {/* TOAST */}
      {/* ================================================= */}

      {toast && (
        <div className="
          fixed
          bottom-8
          left-1/2
          z-50
          flex
          -translate-x-1/2
          items-center
          gap-2
          rounded-md
          border
          border-[#DDE5DF]
          bg-[#10673E]
          px-4
          py-2.5
          text-xs
          font-semibold
          text-white
          shadow-lg
        ">

          {toast.type === "success" ? (
            <CheckCircle2
              size={15}
              className="text-[#8FBF7F]"
            />
          ) : (
            <CircleAlert
              size={15}
              className="text-[#F08080]"
            />
          )}

          {toast.message}

        </div>
      )}

    </div>
  );
}

export default StockTransfer;
