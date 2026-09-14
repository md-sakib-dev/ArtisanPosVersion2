import {
  BadgePercent,
  CheckCircle2,
  CircleAlert,
  ChevronDown,
  Hash,
  Mail,
  Package,
  PackageSearch,
  Phone,
  Printer,
  ReceiptText,
  RotateCcw,
  Scan,
  Search,
  Undo2,
  User,
  X,
} from "lucide-react";

import {
  useCallback,
  useState,
  type ReactNode,
} from "react";


// ======================================================
// TYPES
// ======================================================

interface MasterProduct {
  id: number;
  sku: string;
  barcode: string;
  prodName: string;
  unitPrice: number;
  vat: number;
}

type SearchMode = "sku" | "description";

type Toast =
  | {
      message: string;
      type: "success" | "error";
    }
  | null;


// ======================================================
// SAMPLE DATA
// ======================================================

const refundTypeOptions = [
  "Cash ",
  "Credit slip",

];

const masterProducts: MasterProduct[] = [
  {
    id: 1,
    sku: "SKU-1001",
    barcode: "123456789123456",
    prodName: "Sample Product",
    unitPrice: 200,
    vat: 7.5,
  },
  {
    id: 2,
    sku: "SKU-1002",
    barcode: "789012",
    prodName: "Product Two",
    unitPrice: 150,
    vat: 7.5,
  },
  {
    id: 3,
    sku: "SKU-1003",
    barcode: "345678",
    prodName: "Product Three",
    unitPrice: 500,
    vat: 7.5,
  },
  {
    id: 4,
    sku: "SKU-1004",
    barcode: "123455",
    prodName: "Sample Product 2",
    unitPrice: 200,
    vat: 10,
  },
  {
    id: 5,
    sku: "SKU-1005",
    barcode: "998877",
    prodName: "Refundable Item",
    unitPrice: 320,
    vat: 7.5,
  },
];

interface RefundCartItem extends MasterProduct {
  qty: number;
}
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
  disabled:cursor-not-allowed disabled:bg-[#F3F4F2] disabled:text-gray-400
`;

const lockedInputClass = `
  h-8
  w-full
  cursor-not-allowed
  rounded-md
  border
  border-[#E3E7E0]
  bg-[#F3F4F2]
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
// ADVANCED PRODUCT SEARCH MODAL
// ======================================================

interface SearchModalProps {
  open: boolean;
  products: MasterProduct[];
  onClose: () => void;
  onSelect: (product: MasterProduct) => void;
}

function SearchModal({
  open,
  products,
  onClose,
  onSelect,
}: SearchModalProps) {

  const [query, setQuery] = useState("");

  const [searchBy, setSearchBy] =
    useState<SearchMode>("sku");

  const [selectedId, setSelectedId] =
    useState<number | null>(null);

  if (!open) {
    return null;
  }

  const keyword = query.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (!keyword) {
      return true;
    }

    return searchBy === "sku"
      ? product.sku.toLowerCase().includes(keyword)
      : product.prodName.toLowerCase().includes(keyword);
  });

  const handleSelect = () => {
    const product = products.find(
      (item) => item.id === selectedId
    );

    if (product) {
      onSelect(product);
    }
  };

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
        animation: "rf-fade 150ms ease-out",
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
          animation: "rf-pop 180ms ease-out",
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
              <PackageSearch size={14} />
            </div>

            <div>

              <h2 className="
                text-sm
                font-semibold
                text-[#17231D]
              ">
                Advanced Product Search
              </h2>

              <p className="
                text-[9px]
                text-[#66736B]
              ">
                Search by SKU or description, then
                select a product to refund
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


        {/* SEARCH OPTIONS + FIELD */}

        <div className="
          shrink-0
          border-b
          border-[#ECEFEA]
          bg-white
          px-4
          py-2.5
        ">

          <div className="
            flex
            flex-wrap
            items-center
            gap-2
          ">

            {/* Search mode toggle */}

            <div className="
              flex
              shrink-0
              rounded-md
              border
              border-[#DDE5DF]
              bg-[#F5F7F3]
              p-0.5
            ">

              <button
                type="button"
                onClick={() =>
                  setSearchBy("sku")
                }
                className={`
                  rounded
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  transition
                  ${
                    searchBy === "sku"
                      ? "bg-[#10673E] text-white shadow-sm"
                      : "text-[#66736B] hover:text-[#10673E]"
                  }
                `}
              >
                Search by SKU
              </button>

              <button
                type="button"
                onClick={() =>
                  setSearchBy("description")
                }
                className={`
                  rounded
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  transition
                  ${
                    searchBy === "description"
                      ? "bg-[#10673E] text-white shadow-sm"
                      : "text-[#66736B] hover:text-[#10673E]"
                  }
                `}
              >
                Search by Description
              </button>

            </div>


            {/* Search input */}

            <div className="relative min-w-0 flex-1">

              <Search
                size={14}
                className="
                  absolute
                  left-2.5
                  top-1/2
                  -translate-y-1/2
                  text-[#8A938B]
                "
              />

              <input
                autoFocus
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                className={`
                  ${smallInputClass}
                  pl-9
                `}
                placeholder={
                  searchBy === "sku"
                    ? "Type a SKU…"
                    : "Type a product description…"
                }
              />

            </div>

          </div>

        </div>


        {/* RESULTS TABLE */}

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
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  SKU
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
                  Product
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-right
                  text-[10px]
                  font-semibold
                ">
                  Unit Price
                </th>

              </tr>

            </thead>

            <tbody>

              {filtered.length === 0 ? (

                <tr>

                  <td
                    colSpan={4}
                    className="
                      py-10
                      text-center
                      text-[10px]
                      text-[#9AA29C]
                    "
                  >
                    No products match "{query}"
                  </td>

                </tr>

              ) : (

                filtered.map((product) => {

                  const selected =
                    product.id === selectedId;

                  return (

                    <tr
                      key={product.id}
                      onClick={() =>
                        setSelectedId(product.id)
                      }
                      className={`
                        cursor-pointer
                        border-b
                        border-[#ECEFEA]
                        transition-colors
                        ${
                          selected
                            ? "bg-[#E8F5ED]"
                            : "hover:bg-[#F1F8F3]"
                        }
                      `}
                    >

                      <td className="
                        px-3
                        py-2.5
                        font-mono
                        text-[11px]
                        font-semibold
                        text-[#17231D]
                      ">
                        {product.sku}
                      </td>

                      <td className="
                        px-3
                        py-2.5
                        font-mono
                        text-[11px]
                        text-[#66736B]
                      ">
                        {product.barcode}
                      </td>

                      <td className="
                        px-3
                        py-2.5
                        font-medium
                        text-[#17231D]
                      ">
                        {product.prodName}
                      </td>

                      <td className="
                        px-3
                        py-2.5
                        text-right
                        font-semibold
                        tabular-nums
                        text-[#10673E]
                      ">
                        {product.unitPrice.toFixed(2)}
                      </td>

                    </tr>
                  );
                })

              )}

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

          <button
            type="button"
            onClick={handleSelect}
            disabled={selectedId === null}
            className={`
              inline-flex
              h-9
              items-center
              justify-center
              gap-1.5
              rounded-md
              px-4
              text-xs
              font-semibold
              transition
              active:scale-[0.98]
              ${
                selectedId === null
                  ? "cursor-not-allowed bg-[#E3E7E0] text-[#9AA29C]"
                  : "bg-[#0E9351] text-white shadow-sm hover:bg-[#10673E]"
              }
            `}
          >
            Select Product
          </button>

        </div>

      </div>

    </div>
  );
}


// ======================================================
// SALES REFUND (MAIN)
// ======================================================

function SalesRefund() {

  // ====================================================
  // FORM STATE
  // ====================================================

  const [refundType, setRefundType] =
    useState("");

  const [creditSlipNo, setCreditSlipNo] =
    useState("");

  const [barcodeInput, setBarcodeInput] =
    useState("");

  const [customerPhone, setCustomerPhone] =
    useState("");

  const [customerName, setCustomerName] =
    useState("");

  const [customerEmail, setCustomerEmail] =
    useState("");


  // ====================================================
  // SELECTED PRODUCT + DISCOUNT
  // ====================================================

  const [cartItems, setCartItems] = useState<
    RefundCartItem[]
  >([]);

  const [discountPercent, setDiscountPercent] =
    useState<number>(0);


  // ====================================================
  // UI STATE
  // ====================================================

  const [isSearchOpen, setIsSearchOpen] =
    useState(false);

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
  // PRODUCT HANDLERS
  // ====================================================

  const applyProduct = (
    product: MasterProduct
  ) => {

    setCartItems((prev) => {

      const existing = prev.find(
        (item) => item.id === product.id
      );

      if (existing) {

        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );

      }

      return [
        ...prev,
        { ...product, qty: 1 },
      ];

    });

    showToast(
      `${product.prodName} added to refund`,
      "success"
    );
  };

  const handleBarcodeAdd = () => {

    const barcode = barcodeInput.trim();

    if (!barcode) {
      showToast(
        "Scan or type a barcode first",
        "error"
      );
      return;
    }

    const match = masterProducts.find(
      (product) =>
        product.barcode === barcode
    );

    if (!match) {
      showToast(
        "Product not found",
        "error"
      );
      return;
    }

    applyProduct(match);

    setBarcodeInput("");
  };

  const handleSearchSelect = (
    product: MasterProduct
  ) => {

    applyProduct(product);
    setBarcodeInput("");
    setIsSearchOpen(false);
  };

  const handleRemoveItem = (id: number) => {

    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, qty: item.qty - 1 }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const handleClearCart = () => {

    setCartItems([]);
    setDiscountPercent(0);
  };


  // ====================================================
  // CALCULATIONS
  // ====================================================

  const totalProductPrice = cartItems.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0
  );

  const discountAmount =
    (totalProductPrice * Number(discountPercent)) / 100;

  const priceAfterDiscount =
    totalProductPrice - discountAmount;

  const vatAmount = cartItems.reduce(
    (sum, item) => {

      const itemTotal = item.qty * item.unitPrice;

      const itemShare =
        totalProductPrice > 0
          ? itemTotal / totalProductPrice
          : 0;

      const itemAfterDiscount =
        itemTotal - discountAmount * itemShare;

      return (
        sum +
        (itemAfterDiscount * item.vat) / 100
      );
    },
    0
  );

  const returnAmount =
    priceAfterDiscount + vatAmount;


  // ====================================================
  // RETURN ACTION
  // ====================================================

  const handleReturn = () => {

    if (!refundType) {
      showToast(
        "Select a refund type first",
        "error"
      );
      return;
    }

    if (cartItems.length === 0) {
      showToast(
        "Add a product to refund",
        "error"
      );
      return;
    }

    if (!creditSlipNo.trim()) {
      showToast(
        "Enter the credit slip number",
        "error"
      );
      return;
    }

    showToast(
      `Refund processed — ${returnAmount.toFixed(2)} BDT`,
      "success"
    );
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
        @keyframes rf-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes rf-pop {
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
            <RotateCcw size={16} />
          </div>

          <div>

            <h1 className="
              text-sm
              font-semibold
              leading-none
              text-[#17231D]
            ">
              Sales Refund
            </h1>

            <p className="
              mt-0.5
              text-[9px]
              text-[#66736B]
            ">
              Process refunds against credit slips
              &amp; returned items
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
          <ReceiptText size={11} />
          Credit Slip: {creditSlipNo || "—"}
        </span>

      </header>


      {/* ================================================= */}
      {/* SCROLLABLE CONTENT */}
      {/* ================================================= */}

      <div className="
        min-h-0
        flex-1
        space-y-3
        overflow-auto
        px-[clamp(8px,1vw,16px)]
        py-3
      ">


        {/* =============================================== */}
        {/* REFUND DETAILS CARD */}
        {/* =============================================== */}

        <section className="
          rounded-lg
          border
          border-[#DDE5DF]
          bg-white
          p-4
          shadow-[0_1px_3px_rgba(35,42,35,0.05)]
        ">

          <div className="
            mb-3
            flex
            items-center
            justify-between
          ">

            <div className="
              flex
              items-center
              gap-2
            ">

              <ReceiptText
                size={14}
                className="text-[#10673E]"
              />

              <h2 className="
                text-xs
                font-semibold
                text-[#17231D]
              ">
                Refund Details
              </h2>

            </div>

          </div>

          {/* ROW 1 — Refund Type / Credit Slip / Barcode + Search */}

          <div className="
            grid
            grid-cols-1
            gap-3
            md:grid-cols-3
          ">

            <Field
              label="Refund Type"
              icon={<RotateCcw size={13} />}
            >

              <div className="relative">

                <select
                  value={refundType}
                  onChange={(e) =>
                    setRefundType(e.target.value)
                  }
                  className={`
                    ${smallInputClass}
                    appearance-none
                    pr-8
                    ${refundType ? "" : "text-[#9AA29C]"}
                  `}
                >
                  <option value="" disabled>
                    Select refund type
                  </option>

                  {refundTypeOptions.map((option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ))}

                </select>

                <ChevronDown
                  size={14}
                  className="
                    pointer-events-none
                    absolute
                    right-2.5
                    top-1/2
                    -translate-y-1/2
                    text-[#8A938B]
                  "
                />

              </div>

            </Field>

            <Field
              label="Credit Slip No"
              icon={<Hash size={13} />}
            >

              <input
              type="text"
              disabled={refundType !== "Credit slip"}
                value={creditSlipNo}
                onChange={(e) =>
                  setCreditSlipNo(e.target.value)
                }
                className={smallInputClass} 
                placeholder="Enter credit slip number"
              />

            </Field>

            <Field
              label="Product Barcode"
              icon={<Scan size={13} />}
            >

              <div className="flex gap-1.5">

                <input
                  value={barcodeInput}
                  onChange={(e) =>
                    setBarcodeInput(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleBarcodeAdd();
                    }
                  }}
                  className={`
                    ${smallInputClass}
                    min-w-0
                    flex-1
                    font-mono
                  `}
                  placeholder="Scan or type barcode"
                />

                <button
                  type="button"
                  onClick={() =>
                    setIsSearchOpen(true)
                  }
                  className="
                    inline-flex
                    h-8
                    shrink-0
                    items-center
                    justify-center
                    gap-1
                    rounded-md
                    bg-[#0E9351]
                    px-3
                    text-[10px]
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-[#10673E]
                    active:scale-[0.98]
                  "
                >
                  <Search size={13} />
                  SEARCH PRODUCT
                </button>

              </div>

            </Field>

          </div>

          {/* ROW 2 — Customer info */}

          <div className="
            mt-3
            grid
            grid-cols-1
            gap-3
            md:grid-cols-3
          ">

            <Field
              label="Customer Phone No"
              icon={<Phone size={13} />}
            >

              <input
                value={customerPhone}
                onChange={(e) =>
                  setCustomerPhone(e.target.value)
                }
                className={smallInputClass}
                placeholder="Phone number"
              />

            </Field>

            <Field
              label="Customer Name"
              icon={<User size={13} />}
            >

              <input
                value={customerName}
                onChange={(e) =>
                  setCustomerName(e.target.value)
                }
                className={smallInputClass}
                placeholder="Full name"
              />

            </Field>

            <Field
              label="Customer Email Address"
              icon={<Mail size={13} />}
            >

              <input
                type="email"
                value={customerEmail}
                onChange={(e) =>
                  setCustomerEmail(e.target.value)
                }
                className={smallInputClass}
                placeholder="Email address"
              />

            </Field>

          </div>

        </section>


        {/* =============================================== */}
        {/* REFUND CART TABLE */}
        {/* =============================================== */}

        <section className="
          rounded-lg
          border
          border-[#DDE5DF]
          bg-white
          p-4
          shadow-[0_1px_3px_rgba(35,42,35,0.05)]
        ">

          <div className="
            mb-3
            flex
            flex-wrap
            items-center
            justify-between
            gap-2
          ">

            <div className="
              flex
              items-center
              gap-2
            ">

              <Package
                size={14}
                className="text-[#10673E]"
              />

              <h2 className="
                text-xs
                font-semibold
                text-[#17231D]
              ">
                Refund Cart
              </h2>

            </div>

            {cartItems.length > 0 && (

              <button
                type="button"
                onClick={handleClearCart}
                className={secondaryButtonClass}
              >
                <X size={13} />
                Clear Cart
              </button>

            )}

          </div>

          <div className="
            max-h-[150px]
            overflow-auto
            rounded-md
            border
            border-[#E6EAE3]
          ">

            <table className="
              w-full
              min-w-[680px]
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
                    text-left
                    text-[10px]
                    font-semibold
                  ">
                    Product Name
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
                    text-center
                    text-[10px]
                    font-semibold
                  ">
                    Quantity
                  </th>

                  <th className="
                    px-3
                    py-2.5
                    text-right
                    text-[10px]
                    font-semibold
                  ">
                    Unit Price
                  </th>

                  <th className="
                    px-3
                    py-2.5
                    text-right
                    text-[10px]
                    font-semibold
                  ">
                    Total Price
                  </th>

                  <th className="
                    px-3
                    py-2.5
                    text-center
                    text-[10px]
                    font-semibold
                  ">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {cartItems.length === 0 ? (

                  <tr>

                    <td
                      colSpan={6}
                      className="
                        py-10
                        text-center
                        text-[10px]
                        text-[#9AA29C]
                      "
                    >
                      No products added yet — scan a barcode or use the search button
                    </td>

                  </tr>

                ) : (

                  cartItems.map((item) => {

                    const itemTotal =
                      item.qty * item.unitPrice;

                    return (

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
                          font-medium
                          text-[#17231D]
                        ">
                          {item.prodName}
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
                          text-center
                          font-semibold
                          tabular-nums
                          text-[#17231D]
                        ">
                          {item.qty}
                        </td>

                        <td className="
                          px-3
                          py-2.5
                          text-right
                          tabular-nums
                          text-[#17231D]
                        ">
                          {item.unitPrice.toFixed(2)}
                        </td>

                        <td className="
                          px-3
                          py-2.5
                          text-right
                          font-semibold
                          tabular-nums
                          text-[#10673E]
                        ">
                          {itemTotal.toFixed(2)}
                        </td>

                        <td className="
                          px-3
                          py-2.5
                          text-center
                        ">

                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveItem(item.id)
                            }
                            title="Remove one"
                            className="
                              inline-flex
                              h-7
                              w-7
                              items-center
                              justify-center
                              rounded-md
                              text-[#8A938B]
                              transition
                              hover:bg-[#FCECEC]
                              hover:text-[#B84A4A]
                            "
                          >
                            <X size={13} />
                          </button>

                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>

            </table>

          </div>

        </section>


        {/* =============================================== */}
        {/* RETURN SUMMARY CARD */}
        {/* =============================================== */}

        <section className="
          rounded-lg
          border
          border-[#DDE5DF]
          bg-white
          p-4
          shadow-[0_1px_3px_rgba(35,42,35,0.05)]
        ">

          <div className="
            mb-3
            flex
            flex-wrap
            items-center
            justify-between
            gap-2
          ">

            <div className="
              flex
              items-center
              gap-2
            ">

              <BadgePercent
                size={14}
                className="text-[#10673E]"
              />

              <h2 className="
                text-xs
                font-semibold
                text-[#17231D]
              ">
                Return Calculation
              </h2>

            </div>

            {/* Cart summary strip */}

            {cartItems.length > 0 ? (
              <div className="
                flex
                items-center
                gap-1.5
                rounded-md
                border
                border-[#DDE5DF]
                bg-[#F1F8F3]
                px-2
                py-1
              ">

                <Package
                  size={12}
                  className="text-[#10673E]"
                />

                <span className="
                  text-[10px]
                  font-medium
                  text-[#17231D]
                ">
                  {cartItems.length} item{cartItems.length > 1 ? "s" : ""} in cart
                </span>

              </div>
            ) : (
              <span className="
                text-[10px]
                text-[#9AA29C]
              ">
                No product selected
              </span>
            )}

          </div>

          {/* TOTALS GRID */}

          <div className="
            grid
            grid-cols-2
            gap-3
            md:grid-cols-3
            xl:grid-cols-6
          ">

            <Field
              label="Total Product Price"
              icon={<ReceiptText size={13} />}
            >

              <input
                readOnly
                value={totalProductPrice.toFixed(2)}
                className={lockedInputClass}
              />

            </Field>

            <Field
              label="Discount Percent"
              icon={<BadgePercent size={13} />}
            >

              <div className="relative">

                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercent}
                  onChange={(e) =>
                    setDiscountPercent(
                      Math.max(0, Number(e.target.value))
                    )
                  }
                  disabled={cartItems.length === 0}
                  className={`
                    ${smallInputClass}
                    pr-7
                    disabled:cursor-not-allowed
                    disabled:bg-[#F3F4F2]
                    disabled:text-[#9AA29C]
                  `}
                />

                <span className="
                  pointer-events-none
                  absolute
                  right-2.5
                  top-1/2
                  -translate-y-1/2
                  text-[10px]
                  font-semibold
                  text-[#8A938B]
                ">
                  %
                </span>

              </div>

            </Field>

            <Field
              label="Discount Amount"
              icon={<BadgePercent size={13} />}
            >

              <input
                readOnly
                value={discountAmount.toFixed(2)}
                className={lockedInputClass}
              />

            </Field>

            <Field
              label="Price After Discount"
              icon={<ReceiptText size={13} />}
            >

              <input
                readOnly
                value={priceAfterDiscount.toFixed(2)}
                className={lockedInputClass}
              />

            </Field>

            <Field
              label="VAT Amount"
              icon={<ReceiptText size={13} />}
            >

              <input
                readOnly
                value={vatAmount.toFixed(2)}
                className={lockedInputClass}
              />

            </Field>

            <Field
              label="Return Amount"
              icon={<Undo2 size={13} />}
            >

              <input
                readOnly
                value={returnAmount.toFixed(2)}
                className="
                  h-8
                  w-full
                  cursor-not-allowed
                  rounded-md
                  border
                  border-[#0E9351]/30
                  bg-[#E8F5ED]
                  px-2.5
                  text-xs
                  font-bold
                  text-[#10673E]
                  outline-none
                "
              />

            </Field>

          </div>

          {/* ACTION BUTTONS */}

          <div className="
            mt-4
            flex
            flex-wrap
            items-center
            justify-end
            gap-2
            border-t
            border-[#ECEFEA]
            pt-3
          ">

            <button
              type="button"
              onClick={() =>
                showToast(
                  "Refund slip reprint requested",
                  "success"
                )
              }
              className={secondaryButtonClass}
            >
              <Printer size={13} />
              Ref. Slip Reprint
            </button>

            <button
              type="button"
              onClick={handleReturn}
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-md
                bg-[#0E9351]
                px-6
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-[#10673E]
                active:scale-[0.99]
              "
            >
              <Undo2 size={16} />
              Return
            </button>

          </div>

        </section>

      </div>


      {/* ================================================= */}
      {/* ADVANCED PRODUCT SEARCH MODAL */}
      {/* ================================================= */}

      <SearchModal
        key={String(isSearchOpen)}
        open={isSearchOpen}
        products={masterProducts}
        onClose={() =>
          setIsSearchOpen(false)
        }
        onSelect={handleSearchSelect}
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

export default SalesRefund;
