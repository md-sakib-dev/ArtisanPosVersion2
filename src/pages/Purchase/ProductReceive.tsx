import {
  Boxes,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Download,
  Hash,
  Package,
  PackageCheck,
  Search,
  Truck,
  Warehouse,
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

interface ReceiveItem {
  id: number;
  itemName: string;
  sku: string;
  sentQty: number;
  receivedQty: number;
  unit: string;
}

interface PendingChallan {
  id: number;
  challanNo: string;
  date: string;
  vendor: string;
  totalQty: number;
  items: ReceiveItem[];
}

type ReceiveStatus =
  | "complete"
  | "short"
  | "excess";

type Toast =
  | {
      message: string;
      type: "success" | "error";
    }
  | null;


// ======================================================
// SAMPLE DATA
// ======================================================

const pendingChallans: PendingChallan[] = [
  {
    id: 1,
    challanNo: "CH-2026-0041",
    date: "2026-08-14",
    vendor: "Modern Traders",
    totalQty: 120,
    items: [
      {
        id: 11,
        itemName: "Basmati Rice 5kg",
        sku: "RICE-005",
        sentQty: 50,
        receivedQty: 50,
        unit: "Bag",
      },
      {
        id: 12,
        itemName: "Sunflower Oil 1L",
        sku: "OIL-001",
        sentQty: 40,
        receivedQty: 40,
        unit: "Bottle",
      },
      {
        id: 13,
        itemName: "Sugar 1kg",
        sku: "SUG-010",
        sentQty: 30,
        receivedQty: 30,
        unit: "Pkt",
      },
    ],
  },
  {
    id: 2,
    challanNo: "CH-2026-0038",
    date: "2026-08-12",
    vendor: "Agro Supplies Ltd.",
    totalQty: 60,
    items: [
      {
        id: 21,
        itemName: "Lentil (Masoor) 2kg",
        sku: "LEN-002",
        sentQty: 25,
        receivedQty: 25,
        unit: "Bag",
      },
      {
        id: 22,
        itemName: "Tea Powder 500g",
        sku: "TEA-004",
        sentQty: 20,
        receivedQty: 20,
        unit: "Pkt",
      },
      {
        id: 23,
        itemName: "Salt 1kg",
        sku: "SLT-011",
        sentQty: 15,
        receivedQty: 15,
        unit: "Pkt",
      },
    ],
  },
  {
    id: 3,
    challanNo: "CH-2026-0035",
    date: "2026-08-10",
    vendor: "City Distributors",
    totalQty: 240,
    items: [
      {
        id: 31,
        itemName: "Mineral Water 1L",
        sku: "WTR-020",
        sentQty: 120,
        receivedQty: 120,
        unit: "Bottle",
      },
      {
        id: 32,
        itemName: "Soft Drink 250ml",
        sku: "DRK-021",
        sentQty: 80,
        receivedQty: 80,
        unit: "Bottle",
      },
      {
        id: 33,
        itemName: "Instant Noodles",
        sku: "NDL-030",
        sentQty: 40,
        receivedQty: 40,
        unit: "Pkt",
      },
    ],
  },
  {
    id: 4,
    challanNo: "CH-2026-0031",
    date: "2026-08-07",
    vendor: "Fresh Mart",
    totalQty: 36,
    items: [
      {
        id: 41,
        itemName: "Cooking Oil 5L",
        sku: "OIL-005",
        sentQty: 12,
        receivedQty: 12,
        unit: "Tin",
      },
      {
        id: 42,
        itemName: "Flour 1kg",
        sku: "FLR-012",
        sentQty: 14,
        receivedQty: 14,
        unit: "Pkt",
      },
      {
        id: 43,
        itemName: "Biscuit Assorted",
        sku: "BSC-040",
        sentQty: 10,
        receivedQty: 10,
        unit: "Pack",
      },
    ],
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

const primaryButtonClass = `
  inline-flex
  h-9
  items-center
  justify-center
  gap-1.5
  rounded-md
  bg-[#0E9351]
  px-3.5
  text-xs
  font-semibold
  text-white
  transition
  hover:bg-[#10673E]
  active:scale-[0.98]
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
// HELPERS
// ======================================================

function formatDate(iso: string): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatus(
  sentQty: number,
  receivedQty: number
): ReceiveStatus {
  if (receivedQty < sentQty) {
    return "short";
  }
  if (receivedQty > sentQty) {
    return "excess";
  }
  return "complete";
}


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
// STATUS BADGE
// ======================================================

const statusStyles: Record<
  ReceiveStatus,
  { label: string; className: string }
> = {
  complete: {
    label: "Complete",
    className: "bg-[#E8F5ED] text-[#0E9351]",
  },
  short: {
    label: "Short",
    className: "bg-[#FCECEC] text-[#B84A4A]",
  },
  excess: {
    label: "Excess",
    className: "bg-[#F7EFD8] text-[#9A7B1F]",
  },
};

function StatusBadge({
  status,
}: {
  status: ReceiveStatus;
}) {

  const { label, className } =
    statusStyles[status];

  return (
    <span className={`
      inline-flex
      items-center
      rounded-full
      px-2
      py-0.5
      text-[9px]
      font-semibold
      ${className}
    `}>
      {label}
    </span>
  );
}


// ======================================================
// PENDING CHALLAN MODAL
// ======================================================

interface PendingChallanModalProps {
  open: boolean;
  challans: PendingChallan[];
  onClose: () => void;
  onSelect: (challan: PendingChallan) => void;
}

function PendingChallanModal({
  open,
  challans,
  onClose,
  onSelect,
}: PendingChallanModalProps) {

  if (!open) {
    return null;
  }

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
        animation: "pr-fade 150ms ease-out",
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
          animation: "pr-pop 180ms ease-out",
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
                Pending Challans
              </h2>

              <p className="
                text-[9px]
                text-[#66736B]
              ">
                {challans.length} challans
                awaiting receive
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


        {/* MODAL BODY */}

        <div className="
          min-h-0
          flex-1
          overflow-auto
        ">

          <table className="
            w-full
            min-w-[560px]
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
                  Challan No
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Date
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Vendor / Source
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-center
                  text-[10px]
                  font-semibold
                ">
                  Total Qty
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

              {challans.map((challan) => (

                <tr
                  key={challan.id}
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
                    font-mono
                    text-[11px]
                    font-semibold
                    text-[#17231D]
                  ">
                    {challan.challanNo}
                  </td>

                  <td className="
                    px-3
                    py-2.5
                    text-[#66736B]
                  ">
                    {formatDate(challan.date)}
                  </td>

                  <td className="
                    px-3
                    py-2.5
                    font-medium
                    text-[#17231D]
                  ">
                    {challan.vendor}
                  </td>

                  <td className="
                    px-3
                    py-2.5
                    text-center
                    font-semibold
                    tabular-nums
                    text-[#10673E]
                  ">
                    {challan.totalQty}
                  </td>

                  <td className="px-3 py-2.5 text-center">

                    <button
                      type="button"
                      onClick={() =>
                        onSelect(challan)
                      }
                      className="
                        inline-flex
                        h-7
                        items-center
                        justify-center
                        gap-1
                        rounded-md
                        bg-[#0E9351]
                        px-2.5
                        text-[10px]
                        font-semibold
                        text-white
                        transition
                        hover:bg-[#10673E]
                        active:scale-[0.98]
                      "
                    >
                      <PackageCheck size={12} />
                      Select
                    </button>

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
// PRODUCT RECEIVE (MAIN)
// ======================================================

function ProductReceive() {

  // ====================================================
  // FORM STATE
  // ====================================================

  const [deliveryType, setDeliveryType] =
    useState("Challan");

  const [orderNo, setOrderNo] =
    useState("");

  const [deliveryFrom, setDeliveryFrom] =
    useState("");


  // ====================================================
  // ITEMS STATE
  // ====================================================

  const [items, setItems] =
    useState<ReceiveItem[]>([]);

  const [remarks, setRemarks] =
    useState("");


  // ====================================================
  // UI STATE
  // ====================================================

  const [isModalOpen, setIsModalOpen] =
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
  // LOAD CHALLAN
  // ====================================================

  const loadChallan = (
    challan: PendingChallan
  ) => {

    setDeliveryType("Challan");
    setOrderNo(challan.challanNo);
    setDeliveryFrom(challan.vendor);

    setItems(
      challan.items.map((item) => ({
        ...item,
        receivedQty: item.sentQty,
      }))
    );
  };

  const handleLoad = () => {

    const order = orderNo.trim();

    if (!order) {
      showToast(
        "Enter a Deliver Order No. first",
        "error"
      );
      return;
    }

    const match = pendingChallans.find(
      (challan) =>
        challan.challanNo.toLowerCase() ===
        order.toLowerCase()
    );

    const challan = match ?? pendingChallans[0];

    loadChallan(challan);

    showToast(
      `Challan ${challan.challanNo} loaded`,
      "success"
    );
  };


  // ====================================================
  // CLEAR ORDER NO
  // ====================================================

  const handleClearOrder = () => {

    setOrderNo("");
    setDeliveryFrom("");
  };


  // ====================================================
  // MODAL SELECT
  // ====================================================

  const handleSelectChallan = (
    challan: PendingChallan
  ) => {

    loadChallan(challan);
    setIsModalOpen(false);

    showToast(
      `Challan ${challan.challanNo} loaded`,
      "success"
    );
  };


  // ====================================================
  // RECEIVED QTY
  // ====================================================

  const handleReceivedQty = (
    id: number,
    value: string
  ) => {

    setItems((previousItems) =>
      previousItems.map((item) =>
        item.id === id
          ? {
              ...item,
              receivedQty: Math.max(
                0,
                Number(value) || 0
              ),
            }
          : item
      )
    );
  };


  // ====================================================
  // CALCULATIONS
  // ====================================================

  const totalSentQty = items.reduce(
    (total, item) =>
      total + item.sentQty,
    0
  );

  const totalReceivedQty = items.reduce(
    (total, item) =>
      total + item.receivedQty,
    0
  );


  // ====================================================
  // RECEIVE
  // ====================================================

  const handleReceive = () => {

    if (items.length === 0) {
      showToast(
        "Nothing to receive — load a challan first",
        "error"
      );
      return;
    }

    showToast(
      `Received ${items.length} items (${totalReceivedQty} units)`,
      "success"
    );
  };


  // ====================================================
  // DOWNLOAD / EXPORT
  // ====================================================

  const handleDownload = () => {

    if (items.length === 0) {
      showToast(
        "Nothing to export yet",
        "error"
      );
      return;
    }

    const header = [
      "Sl No",
      "Item Name",
      "Barcode/SKU",
      "Sent Qty",
      "Received Qty",
      "Unit",
      "Status",
    ];

    const rows = items.map((item, index) => [
      String(index + 1),
      item.itemName,
      item.sku,
      String(item.sentQty),
      String(item.receivedQty),
      item.unit,
      statusStyles[
        getStatus(
          item.sentQty,
          item.receivedQty
        )
      ].label,
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) =>
            `"${cell.replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "product-receive.csv";
    link.click();

    URL.revokeObjectURL(url);

    showToast(
      "Report exported successfully",
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
        @keyframes pr-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pr-pop {
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
              Product Receive
            </h1>

            <p className="
              mt-0.5
              text-[9px]
              text-[#66736B]
            ">
              Goods Receipt &amp;
              Challan Management
            </p>

          </div>

        </div>


        <div className="
          flex
          items-center
          gap-1.5
        ">

          <button
            type="button"
            onClick={() =>
              setIsModalOpen(true)
            }
            className={primaryButtonClass}
          >
            <ClipboardList size={13} />
            Pending Challan
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className={secondaryButtonClass}
          >
            <Download size={13} />
            Download
          </button>

        </div>

      </header>


      {/* ================================================= */}
      {/* FORM CONTROLS */}
      {/* ================================================= */}

      <section className="
        shrink-0
        border-b
        border-[#DDE5DF]
        bg-white
        px-[clamp(8px,1vw,16px)]
        py-2.5
      ">

        <div className="
          grid
          grid-cols-1
          gap-2
          md:grid-cols-2
          xl:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1.2fr)]
        ">

          {/* DELIVERY TYPE */}

          <Field
            label="Delivery Type"
            icon={<Truck size={13} />}
          >

            <select
              value={deliveryType}
              onChange={(e) =>
                setDeliveryType(e.target.value)
              }
              className={smallInputClass}
            >
              <option>Challan</option>
              <option>Direct Purchase</option>
              <option>Transfer</option>
              <option>Return</option>
            </select>

          </Field>


          {/* DELIVER ORDER NO + LOAD */}

          <Field
            label="Deliver Order No."
            icon={<Hash size={13} />}
          >

            <div className="
              flex
              items-center
              gap-1.5
            ">

              <div className="
                relative
                min-w-0
                flex-1
              ">

                <input
                  value={orderNo}
                  onChange={(e) =>
                    setOrderNo(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleLoad();
                    }
                  }}
                  className={`
                    ${smallInputClass}
                    pr-8
                    font-mono
                  `}
                  placeholder="e.g. CH-2026-0041"
                />

                {orderNo && (

                  <button
                    type="button"
                    onClick={handleClearOrder}
                    title="Clear"
                    className="
                      absolute
                      right-1.5
                      top-1/2
                      flex
                      h-5
                      w-5
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded
                      text-[#8A938B]
                      transition
                      hover:bg-[#F1F8F3]
                      hover:text-[#10673E]
                    "
                  >
                    <X size={13} />
                  </button>

                )}

              </div>

              <button
                type="button"
                onClick={handleLoad}
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
                  transition
                  hover:bg-[#10673E]
                  active:scale-[0.98]
                "
              >
                <Search size={13} />
                Load
              </button>

            </div>

          </Field>


          {/* DELIVERY FROM */}

          <Field
            label="Delivery From"
            icon={<Warehouse size={13} />}
          >

            <input
              readOnly
              value={
                deliveryFrom || "No source loaded"
              }
              className={readOnlyInputClass}
            />

          </Field>

        </div>

      </section>


      {/* ================================================= */}
      {/* INVENTORY RECEIVE TABLE */}
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

            <PackageCheck
              size={14}
              className="text-[#10673E]"
            />

            <span className="
              text-xs
              font-semibold
              text-[#10673E]
            ">
              Inventory Receive
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
            {totalReceivedQty} / {totalSentQty} units
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
            min-w-[720px]
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
                  Item Name
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Barcode / SKU
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-center
                  text-[10px]
                  font-semibold
                ">
                  Sent Qty
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-center
                  text-[10px]
                  font-semibold
                ">
                  Received Qty
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
                  Status
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
                        No items to receive
                      </p>

                      <p className="
                        mt-1
                        text-[10px]
                      ">
                        Load a challan or enter
                        an order number
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                items.map((item, index) => {

                  const status = getStatus(
                    item.sentQty,
                    item.receivedQty
                  );

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
                        font-medium
                        text-[#17231D]
                      ">
                        {item.itemName}
                      </td>

                      <td className="
                        px-3
                        py-2
                        font-mono
                        text-[11px]
                        text-[#66736B]
                      ">
                        {item.sku}
                      </td>

                      <td className="
                        px-3
                        py-2
                        text-center
                        font-medium
                        tabular-nums
                        text-[#66736B]
                      ">
                        {item.sentQty}
                      </td>

                      <td className="
                        px-3
                        py-2
                        text-center
                      ">

                        <input
                          type="number"
                          min={0}
                          value={item.receivedQty}
                          onChange={(e) =>
                            handleReceivedQty(
                              item.id,
                              e.target.value
                            )
                          }
                          className="
                            h-7
                            w-16
                            rounded-md
                            border
                            border-[#DDE5DF]
                            bg-white
                            px-1.5
                            text-center
                            text-xs
                            font-semibold
                            tabular-nums
                            text-[#17231D]
                            outline-none
                            transition
                            focus:border-[#0E9351]
                            focus:ring-2
                            focus:ring-[#0E9351]/15
                          "
                        />

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

                        <StatusBadge
                          status={status}
                        />

                      </td>

                    </tr>

                  );
                })

              )}

            </tbody>

          </table>

        </div>

      </section>


      {/* ================================================= */}
      {/* BOTTOM ACTION AREA */}
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
            placeholder="Add receiving notes (optional)"
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


        {/* RECEIVE BUTTON */}

        <button
          type="button"
          onClick={handleReceive}
          className="
            inline-flex
            h-14
            shrink-0
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
          "
        >
          <PackageCheck size={17} />
          Receive
        </button>

      </footer>


      {/* ================================================= */}
      {/* PENDING CHALLAN MODAL */}
      {/* ================================================= */}

      <PendingChallanModal
        open={isModalOpen}
        challans={pendingChallans}
        onClose={() =>
          setIsModalOpen(false)
        }
        onSelect={handleSelectChallan}
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

export default ProductReceive;
