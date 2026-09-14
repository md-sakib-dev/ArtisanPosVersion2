import {
  Boxes,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Download,
  Hash,
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

type DeliveryType =
  | "Factory"
  | "Stock Transfer"
  | "Pricing";

interface ReceiveItem {
  id: number;
  productName: string;
  description: string;
  barcode: string;
  challanQty: number;
  receivedQty: number;
  price: number;
}

interface PendingChallan {
  id: number;
  type: DeliveryType;
  challanNo: string;
  challanTime: string;
  deliveryFrom: string;
  items: ReceiveItem[];
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

const deliveryTypeOptions: DeliveryType[] = [
  "Factory",
  "Stock Transfer",
  "Pricing",
];

const pendingChallans: PendingChallan[] = [
  {
    id: 1,
    type: "Factory",
    challanNo: "ARTSND-2608015038",
    challanTime: "30 Aug 2026, 09:30 AM",
    deliveryFrom: "Head Office",
    items: [
      {
        id: 11,
        productName: "Men's Casual Shirt",
        description: "Cotton slim fit, sky blue",
        barcode: "8801234567890",
        challanQty: 48,
        receivedQty: 48,
        price: 320,
      },
      {
        id: 12,
        productName: "Women's Silk Scarf",
        description: "Handwoven, floral print",
        barcode: "8801234567891",
        challanQty: 36,
        receivedQty: 36,
        price: 750,
      },
      {
        id: 13,
        productName: "Kids' Denim Jacket",
        description: "Washed denim, full sleeve",
        barcode: "8801234567892",
        challanQty: 24,
        receivedQty: 24,
        price: 950,
      },
    ],
  },
  {
    id: 2,
    type: "Stock Transfer",
    challanNo: "ARTSND-2608015042",
    challanTime: "30 Aug 2026, 12:15 PM",
    deliveryFrom: "Uttara Branch",
    items: [
      {
        id: 21,
        productName: "Men's Polo T-Shirt",
        description: "Cotton pique, navy",
        barcode: "8801234567893",
        challanQty: 60,
        receivedQty: 60,
        price: 1250,
      },
      {
        id: 22,
        productName: "Women's Panjabi",
        description: "Embroidered cotton, beige",
        barcode: "8801234567894",
        challanQty: 45,
        receivedQty: 45,
        price: 1680,
      },
      {
        id: 23,
        productName: "Women's Leggings",
        description: "Stretchable, black",
        barcode: "8801234567895",
        challanQty: 30,
        receivedQty: 30,
        price: 2100,
      },
    ],
  },
  {
    id: 3,
    type: "Pricing",
    challanNo: "ARTSND-2608015047",
    challanTime: "31 Aug 2026, 04:05 PM",
    deliveryFrom: "Central Warehouse",
    items: [
      {
        id: 31,
        productName: "Men's Formal Trousers",
        description: "Slim fit, charcoal grey",
        barcode: "8801234567896",
        challanQty: 90,
        receivedQty: 90,
        price: 450,
      },
      {
        id: 32,
        productName: "Women's Maxi Dress",
        description: "Rayon, boho print",
        barcode: "8801234567897",
        challanQty: 55,
        receivedQty: 55,
        price: 380,
      },
      {
        id: 33,
        productName: "Baby Hoodie Set",
        description: "Fleece, 2-piece, pastel",
        barcode: "8801234567898",
        challanQty: 40,
        receivedQty: 40,
        price: 890,
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
  shadow-sm
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

const typeBadgeStyles: Record<
  DeliveryType,
  string
> = {
  Factory: "bg-[#E8F5ED] text-[#0E9351]",
  "Stock Transfer": "bg-[#F7EFD8] text-[#9A7B1F]",
  Pricing: "bg-[#F3F4F2] text-[#66736B]",
};


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
// TYPE BADGE
// ======================================================

function TypeBadge({
  type,
}: {
  type: DeliveryType;
}) {

  return (
    <span className={`
      inline-flex
      items-center
      rounded-full
      px-2
      py-0.5
      text-[9px]
      font-semibold
      ${typeBadgeStyles[type]}
    `}>
      {type}
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
                awaiting receive — click a row
                to select
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
                  Type
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Challan No.
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Challan Time
                </th>

              </tr>

            </thead>

            <tbody>

              {challans.map((challan) => (

                <tr
                  key={challan.id}
                  onClick={() =>
                    onSelect(challan)
                  }
                  title="Click to select this challan"
                  className="
                    cursor-pointer
                    border-b
                    border-[#ECEFEA]
                    transition-colors
                    hover:bg-[#F1F8F3]
                  "
                >

                  <td className="
                    px-3
                    py-2.5
                  ">
                    <TypeBadge
                      type={challan.type}
                    />
                  </td>

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
                    {challan.challanTime}
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
    useState<DeliveryType | "">("");

  const [orderNo, setOrderNo] =
    useState("ARTSND-2608015038");

  const [deliveryFrom, setDeliveryFrom] =
    useState("Head Office");


  // ====================================================
  // LOADED CHALLAN STATE
  // ====================================================

  const [activeChallan, setActiveChallan] =
    useState<PendingChallan | null>(null);

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

    setDeliveryType(challan.type);
    setOrderNo(challan.challanNo);
    setDeliveryFrom(challan.deliveryFrom);

    setActiveChallan(challan);

    setItems(
      challan.items.map((item) => ({
        ...item,
        receivedQty: item.challanQty,
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

    if (!match) {
      showToast(
        "No pending challan found for this order no.",
        "error"
      );
      return;
    }

    loadChallan(match);

    showToast(
      `Challan ${match.challanNo} loaded`,
      "success"
    );
  };


  // ====================================================
  // CLEAR ORDER NO
  // ====================================================

  const handleClearOrder = () => {

    setOrderNo("");
    setDeliveryType("");
    setDeliveryFrom("");

    setActiveChallan(null);
    setItems([]);
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

  const totalChallanQty = items.reduce(
    (total, item) =>
      total + item.challanQty,
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
      "Product Name",
      "Description",
      "Barcode",
      "Challan Qty",
      "Received Qty",
      "Price",
    ];

    const rows = items.map((item) => [
      item.productName,
      item.description,
      item.barcode,
      String(item.challanQty),
      String(item.receivedQty),
      item.price.toFixed(2),
    ]);

    const totalsRow = [
      "Total Quantity",
      "",
      "",
      String(totalChallanQty),
      String(totalReceivedQty),
      "",
    ];

    const csv = [header, ...rows, totalsRow]
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
            <PackageCheck size={16} />
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
              Receive goods against pending
              challans
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
                setDeliveryType(
                  e.target.value as DeliveryType | ""
                )
              }
              className={`
                ${smallInputClass}
                ${deliveryType ? "" : "text-[#9AA29C]"}
              `}
            >
              <option value="" disabled>
                Select delivery type
              </option>

              {deliveryTypeOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}

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
                  placeholder="e.g. ARTSND-2608015038"
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
                  shadow-sm
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
              value={deliveryFrom}
              placeholder="Load a challan"
              className={readOnlyInputClass}
            />

          </Field>

        </div>

      </section>


      {/* ================================================= */}
      {/* PRODUCT TABLE */}
      {/* ================================================= */}

      <section className="
        flex
        min-h-0
        min-w-0
        flex-1
        flex-col
        overflow-hidden
        bg-white
      ">

        {activeChallan ? (

          <>

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
                  text-[#17231D]
                ">
                  Product Table
                </span>

                <TypeBadge
                  type={activeChallan.type}
                />

                <span className="
                  rounded
                  border
                  border-[#ECEFEA]
                  bg-white
                  px-1.5
                  py-0.5
                  font-mono
                  text-[9px]
                  text-[#66736B]
                ">
                  {activeChallan.challanNo}
                </span>

              </div>

              <span className="
                text-[10px]
                text-[#66736B]
              ">
                {items.length} items · {totalReceivedQty} / {totalChallanQty} units
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
                      Description
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
                      Challan Qty
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
                      text-right
                      text-[10px]
                      font-semibold
                    ">
                      Price
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {items.map((item) => (

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
                        font-medium
                        text-[#17231D]
                      ">
                        {item.productName}
                      </td>

                      <td className="
                        px-3
                        py-2
                        text-[#66736B]
                      ">
                        {item.description}
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
                        text-center
                        font-medium
                        tabular-nums
                        text-[#66736B]
                      ">
                        {item.challanQty}
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
                        text-right
                        font-medium
                        tabular-nums
                        text-[#17231D]
                      ">
                        {item.price.toFixed(2)}
                      </td>

                    </tr>
                  ))}

                </tbody>

                <tfoot className="
                  sticky
                  bottom-0
                  z-10
                  border-t-2
                  border-[#10673E]
                  bg-[#F1F8F3]
                ">

                  <tr>

                    <td
                      colSpan={3}
                      className="
                        px-3
                        py-2.5
                        text-left
                        text-xs
                        font-bold
                        text-[#17231D]
                      "
                    >
                      Total Quantity
                    </td>

                    <td className="
                      px-3
                      py-2.5
                      text-center
                      text-xs
                      font-bold
                      tabular-nums
                      text-[#17231D]
                    ">
                      {totalChallanQty}
                    </td>

                    <td className="
                      px-3
                      py-2.5
                      text-center
                      text-xs
                      font-bold
                      tabular-nums
                      text-[#10673E]
                    ">
                      {totalReceivedQty}
                    </td>

                    <td className="
                      px-3
                      py-2.5
                    " />

                  </tr>

                </tfoot>

              </table>

            </div>

          </>

        ) : (

          /* EMPTY STATE — NO CHALLAN LOADED */

          <div className="
            flex
            flex-1
            flex-col
            items-center
            justify-center
            px-4
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
              No challan loaded
            </p>

            <p className="
              mt-1
              text-[10px]
            ">
              Select a pending challan or enter
              an order no. and press Load
            </p>

          </div>

        )}

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
        border-t
        border-[#DDE5DF]
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
