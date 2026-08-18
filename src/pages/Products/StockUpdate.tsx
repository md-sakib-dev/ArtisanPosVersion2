import {
  Boxes,
  CheckCircle2,
  CircleAlert,
  FolderTree,
  Gem,
  Hash,
  LayoutGrid,
  Package,
  PackageCheck,
  Palette,
  Ruler,
  Scan,
  Search,
  Shirt,
  Tags,
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

interface StockProduct {
  id: number;
  barcode: string;
  prodName: string;
  group: string;
  type: string;
  category: string;
  style: string;
  brand: string;
  size: string;
  color: string;
  stock: number;
}

type Toast =
  | {
      message: string;
      type: "success" | "error";
    }
  | null;


// ======================================================
// SAMPLE DATA
// ======================================================

const stockProducts: StockProduct[] = [
  {
    id: 1,
    barcode: "123456789123456",
    prodName: "Men's Casual Shirt",
    group: "Apparel",
    type: "Shirt",
    category: "Casual",
    style: "Regular Fit",
    brand: "Local Brand",
    size: "M",
    color: "Blue",
    stock: 25,
  },
  {
    id: 2,
    barcode: "789012",
    prodName: "Women's Formal Blouse",
    group: "Apparel",
    type: "Blouse",
    category: "Formal",
    style: "Slim Fit",
    brand: "Elegance",
    size: "L",
    color: "White",
    stock: 12,
  },
  {
    id: 3,
    barcode: "345678",
    prodName: "Denim Jeans",
    group: "Apparel",
    type: "Pants",
    category: "Casual",
    style: "Skinny",
    brand: "Local Brand",
    size: "32",
    color: "Dark Blue",
    stock: 40,
  },
  {
    id: 4,
    barcode: "123455",
    prodName: "Leather Belt",
    group: "Accessories",
    type: "Belt",
    category: "Everyday",
    style: "Classic",
    brand: "Heritage",
    size: "One Size",
    color: "Brown",
    stock: 60,
  },
  {
    id: 5,
    barcode: "998877",
    prodName: "Woolen Scarf",
    group: "Accessories",
    type: "Scarf",
    category: "Winter",
    style: "Classic",
    brand: "Winterline",
    size: "One Size",
    color: "Gray",
    stock: 8,
  },
  {
    id: 6,
    barcode: "556677",
    prodName: "Sports Sneakers",
    group: "Footwear",
    type: "Shoes",
    category: "Sports",
    style: "Running",
    brand: "Active Gear",
    size: "42",
    color: "Black",
    stock: 18,
  },
  {
    id: 7,
    barcode: "443322",
    prodName: "Cotton Polo Shirt",
    group: "Apparel",
    type: "Shirt",
    category: "Casual",
    style: "Regular Fit",
    brand: "Local Brand",
    size: "XL",
    color: "Green",
    stock: 33,
  },
  {
    id: 8,
    barcode: "112233",
    prodName: "Canvas Tote Bag",
    group: "Accessories",
    type: "Bag",
    category: "Everyday",
    style: "Minimal",
    brand: "Heritage",
    size: "One Size",
    color: "Beige",
    stock: 21,
  },
];


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
  cursor-default
  rounded-md
  border
  border-[#E3E7E0]
  bg-[#F3F4F2]
  px-2.5
  text-xs
  font-medium
  text-[#17231D]
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
// SECTION HEADER
// ======================================================

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  hint?: string;
}

function SectionHeader({
  icon,
  title,
  hint,
}: SectionHeaderProps) {

  return (
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

        <span className="
          flex
          h-6
          w-6
          items-center
          justify-center
          rounded-md
          bg-[#E8F5ED]
          text-[#10673E]
        ">
          {icon}
        </span>

        <h2 className="
          text-xs
          font-semibold
          text-[#17231D]
        ">
          {title}
        </h2>

      </div>

      {hint && (
        <span className="
          text-[10px]
          text-[#9AA29C]
        ">
          {hint}
        </span>
      )}

    </div>
  );
}


// ======================================================
// SEARCH & SELECT PRODUCT MODAL
// ======================================================

interface SearchModalProps {
  open: boolean;
  products: StockProduct[];
  onClose: () => void;
  onSelect: (product: StockProduct) => void;
}

function SearchModal({
  open,
  products,
  onClose,
  onSelect,
}: SearchModalProps) {

  const [barcodeFilter, setBarcodeFilter] =
    useState("");

  const [nameFilter, setNameFilter] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [brandFilter, setBrandFilter] =
    useState("");

  const [selectedId, setSelectedId] =
    useState<number | null>(null);

  if (!open) {
    return null;
  }

  const matches = (value: string, filter: string) =>
    value.toLowerCase().includes(filter.trim().toLowerCase());

  const filtered = products.filter((product) =>
    matches(product.barcode, barcodeFilter) &&
    matches(product.prodName, nameFilter) &&
    matches(product.category, categoryFilter) &&
    matches(product.brand, brandFilter)
  );

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
        animation: "su-fade 150ms ease-out",
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
          max-h-[85vh]
          w-full
          max-w-4xl
          flex-col
          overflow-hidden
          rounded-xl
          border
          border-[#DDE5DF]
          bg-white
          shadow-2xl
        "
        style={{
          animation: "su-pop 180ms ease-out",
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
              <Boxes size={14} />
            </div>

            <div>

              <h2 className="
                text-sm
                font-semibold
                text-[#17231D]
              ">
                Search &amp; Select Product
              </h2>

              <p className="
                text-[9px]
                text-[#66736B]
              ">
                {products.length} products in catalog
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


        {/* FILTER BAR */}

        <div className="
          shrink-0
          border-b
          border-[#ECEFEA]
          bg-white
          px-4
          py-2.5
        ">

          <div className="
            grid
            grid-cols-1
            gap-2
            sm:grid-cols-2
            lg:grid-cols-4
          ">

            <Field label="Barcode">
              <input
                value={barcodeFilter}
                onChange={(e) =>
                  setBarcodeFilter(e.target.value)
                }
                className={`
                  ${smallInputClass}
                  font-mono
                `}
                placeholder="Filter barcode"
              />
            </Field>

            <Field label="Product Name">
              <input
                value={nameFilter}
                onChange={(e) =>
                  setNameFilter(e.target.value)
                }
                className={smallInputClass}
                placeholder="Filter name"
              />
            </Field>

            <Field label="Category">
              <input
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value)
                }
                className={smallInputClass}
                placeholder="Filter category"
              />
            </Field>

            <Field label="Brand">
              <input
                value={brandFilter}
                onChange={(e) =>
                  setBrandFilter(e.target.value)
                }
                className={smallInputClass}
                placeholder="Filter brand"
              />
            </Field>

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
            min-w-[960px]
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
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Group
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Type
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Category
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Brand
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-center
                  text-[10px]
                  font-semibold
                ">
                  Size
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Color
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-right
                  text-[10px]
                  font-semibold
                ">
                  Stock
                </th>

              </tr>

            </thead>

            <tbody>

              {filtered.length === 0 ? (

                <tr>

                  <td
                    colSpan={9}
                    className="
                      py-10
                      text-center
                      text-[10px]
                      text-[#9AA29C]
                    "
                  >
                    No products match the current filters
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
                        font-medium
                        text-[#17231D]
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
                        text-[#66736B]
                      ">
                        {product.group}
                      </td>

                      <td className="
                        px-3
                        py-2.5
                        text-[#66736B]
                      ">
                        {product.type}
                      </td>

                      <td className="
                        px-3
                        py-2.5
                        text-[#66736B]
                      ">
                        {product.category}
                      </td>

                      <td className="
                        px-3
                        py-2.5
                        text-[#66736B]
                      ">
                        {product.brand}
                      </td>

                      <td className="
                        px-3
                        py-2.5
                        text-center
                        text-[#66736B]
                      ">
                        {product.size}
                      </td>

                      <td className="
                        px-3
                        py-2.5
                        text-[#66736B]
                      ">
                        {product.color}
                      </td>

                      <td className="
                        px-3
                        py-2.5
                        text-right
                        font-semibold
                        tabular-nums
                        text-[#10673E]
                      ">
                        {product.stock}
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
            Cancel
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
            Select
          </button>

        </div>

      </div>

    </div>
  );
}


// ======================================================
// STOCK UPDATE (MAIN)
// ======================================================

function StockUpdate() {

  // ====================================================
  // FORM STATE
  // ====================================================

  const [barcodeInput, setBarcodeInput] =
    useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<StockProduct | null>(null);

  const [updateQty, setUpdateQty] =
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
    product: StockProduct
  ) => {

    setSelectedProduct(product);
    setBarcodeInput(product.barcode);
    setUpdateQty(0);

    showToast(
      `${product.prodName} selected`,
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

    const match = stockProducts.find(
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
  };

  const handleSearchSelect = (
    product: StockProduct
  ) => {

    applyProduct(product);
    setIsSearchOpen(false);
  };

  const handleClearProduct = () => {

    setSelectedProduct(null);
    setBarcodeInput("");
    setUpdateQty(0);
  };


  // ====================================================
  // STOCK ACTION
  // ====================================================

  const newStock =
    (selectedProduct?.stock ?? 0) + Number(updateQty);

  const handleUpdate = () => {

    if (!selectedProduct) {
      showToast(
        "Select a product first",
        "error"
      );
      return;
    }

    if (Number(updateQty) <= 0) {
      showToast(
        "Enter a quantity greater than 0",
        "error"
      );
      return;
    }

    showToast(
      `${selectedProduct.prodName} — stock updated to ${newStock} units`,
      "success"
    );

    setUpdateQty(0);
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
        @keyframes su-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes su-pop {
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
            <Package size={16} />
          </div>

          <div>

            <h1 className="
              text-sm
              font-semibold
              leading-none
              text-[#17231D]
            ">
              Stock Update
            </h1>

            <p className="
              mt-0.5
              text-[9px]
              text-[#66736B]
            ">
              Adjust stock levels for existing
              products
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
          <Boxes size={11} />
          {selectedProduct
            ? `${selectedProduct.prodName} • ${selectedProduct.stock} in stock`
            : "No product selected"}
        </span>

      </header>


      {/* ================================================= */}
      {/* SCROLLABLE CONTENT */}
      {/* ================================================= */}

      <div className="
        min-h-0
        flex-1
        overflow-auto
        px-[clamp(8px,1vw,16px)]
        py-3
      ">

        <section className="
          w-full
          rounded-lg
          border
          border-[#DDE5DF]
          bg-white
          p-4
          shadow-[0_1px_3px_rgba(35,42,35,0.05)]
        ">


          {/* ============================================= */}
          {/* SEARCH PRODUCT */}
          {/* ============================================= */}

          <div className="
            border-b
            border-[#ECEFEA]
            pb-4
          ">

            <SectionHeader
              icon={<Search size={13} />}
              title="Search Product"
              hint="Scan a barcode or use the product search"
            />

            <div className="
              flex
              flex-col
              gap-2
              sm:flex-row
            ">

              <div className="w-72">

              <Field
                label="Product Barcode"
                icon={<Scan size={13} />}
              >

                <div className="relative">

                  <Scan
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
                      pl-9
                      font-mono
                    `}
                    placeholder="Scan or type product barcode"
                  />

                </div>

              </Field>

              </div>

              <div className="
                flex
                items-end
                gap-1.5
              ">

                <button
                  type="button"
                  onClick={() =>
                    setIsSearchOpen(true)
                  }
                  className="
                    inline-flex
                    h-8
                    items-center
                    justify-center
                    gap-1.5
                    rounded-md
                    bg-[#0E9351]
                    px-4
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

                {selectedProduct && (
                  <button
                    type="button"
                    onClick={handleClearProduct}
                    title="Clear selection"
                    className="
                      inline-flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-md
                      border
                      border-[#DDE5DF]
                      bg-white
                      text-[#8A938B]
                      transition
                      hover:border-[#B84A4A]/40
                      hover:bg-[#FCECEC]
                      hover:text-[#B84A4A]
                    "
                  >
                    <X size={14} />
                  </button>
                )}

              </div>

            </div>

          </div>


          {/* ============================================= */}
          {/* PRODUCT SPECIFICATION (READ-ONLY) */}
          {/* ============================================= */}

          <div className="
            border-b
            border-[#ECEFEA]
            py-4
          ">

            <SectionHeader
              icon={<Boxes size={13} />}
              title="Product Specification"
              hint="Read-only — populated from the selected product"
            />

            <div className="
              grid
              grid-cols-2
              gap-3
              md:grid-cols-4
            ">

              <Field
                label="Group"
                icon={<LayoutGrid size={13} />}
              >
                <input
                  readOnly
                  value={selectedProduct?.group ?? "—"}
                  className={readOnlyInputClass}
                />
              </Field>

              <Field
                label="Type"
                icon={<Tags size={13} />}
              >
                <input
                  readOnly
                  value={selectedProduct?.type ?? "—"}
                  className={readOnlyInputClass}
                />
              </Field>

              <Field
                label="Category"
                icon={<FolderTree size={13} />}
              >
                <input
                  readOnly
                  value={selectedProduct?.category ?? "—"}
                  className={readOnlyInputClass}
                />
              </Field>

              <Field
                label="Style"
                icon={<Shirt size={13} />}
              >
                <input
                  readOnly
                  value={selectedProduct?.style ?? "—"}
                  className={readOnlyInputClass}
                />
              </Field>

              <Field
                label="Brand"
                icon={<Gem size={13} />}
              >
                <input
                  readOnly
                  value={selectedProduct?.brand ?? "—"}
                  className={readOnlyInputClass}
                />
              </Field>

              <Field
                label="Size"
                icon={<Ruler size={13} />}
              >
                <input
                  readOnly
                  value={selectedProduct?.size ?? "—"}
                  className={readOnlyInputClass}
                />
              </Field>

              <Field
                label="Color"
                icon={<Palette size={13} />}
              >
                <input
                  readOnly
                  value={selectedProduct?.color ?? "—"}
                  className={readOnlyInputClass}
                />
              </Field>

              <Field
                label="Current Stock"
                icon={<Boxes size={13} />}
              >
                <input
                  readOnly
                  value={
                    selectedProduct
                      ? `${selectedProduct.stock} units`
                      : "—"
                  }
                  className="
                    h-8
                    w-full
                    cursor-default
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

          </div>


          {/* ============================================= */}
          {/* STOCK ACTION */}
          {/* ============================================= */}

          <div className="
            pt-4
          ">

            <SectionHeader
              icon={<PackageCheck size={13} />}
              title="Stock Adjustment"
              hint="Quantity is added to the current stock"
            />

            <div className="
              flex
              flex-wrap
              items-end
              gap-2
            ">

              <div className="w-40">

                <Field
                  label="Update Qty"
                  icon={<Hash size={13} />}
                >

                  <input
                    type="number"
                    min={0}
                    value={updateQty}
                    onChange={(e) =>
                      setUpdateQty(
                        Math.max(0, Number(e.target.value))
                      )
                    }
                    disabled={!selectedProduct}
                    className={`
                      ${smallInputClass}
                      text-right
                      font-semibold
                      disabled:cursor-not-allowed
                      disabled:bg-[#F3F4F2]
                      disabled:text-[#9AA29C]
                    `}
                  />

                </Field>

              </div>

              <button
                type="button"
                onClick={handleUpdate}
                className="
                  inline-flex
                  h-9
                  items-center
                  justify-center
                  gap-2
                  rounded-md
                  bg-[#0E9351]
                  px-6
                  text-xs
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-[#10673E]
                  active:scale-[0.98]
                "
              >
                <PackageCheck size={15} />
                Update
              </button>

              {selectedProduct && (
                <span className="
                  mb-1.5
                  text-[10px]
                  text-[#66736B]
                ">
                  Current {selectedProduct.stock} +{" "}
                  {updateQty || 0} ={" "}
                  <b className="text-[#10673E]">
                    {newStock} units
                  </b>
                </span>
              )}

            </div>

          </div>

        </section>

      </div>


      {/* ================================================= */}
      {/* SEARCH & SELECT PRODUCT MODAL */}
      {/* ================================================= */}

      <SearchModal
        key={String(isSearchOpen)}
        open={isSearchOpen}
        products={stockProducts}
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

export default StockUpdate;
