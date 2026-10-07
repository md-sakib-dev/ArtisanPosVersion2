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
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getPendingChallans,
  getProductReceiveByReference,
  receiveChalan,
  type PendingChallan,
  type ProductReceiveDetail,
} from "../../api/productReceiveApi";

/*
  Change the import above if your API service file
  has a different path/name.
*/


/* ================================================================
   TYPES
================================================================ */

type ReceiveItem = ProductReceiveDetail;

type Toast =
  | {
      message: string;
      type: "success" | "error";
    }
  | null;


/* ================================================================
   STYLES
================================================================ */

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


/* ================================================================
   FIELD
================================================================ */

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
      <label
        className="
          mb-1
          flex
          items-center
          gap-1
          text-[10px]
          font-semibold
          text-[#66736B]
        "
      >
        {icon}
        {label}
      </label>

      {children}
    </div>
  );
}


/* ================================================================
   TYPE BADGE
================================================================ */

function TypeBadge({
  type,
}: {
  type: string;
}) {
  let badgeClass =
    "bg-[#F3F4F2] text-[#66736B]";

  if (type === "Factory") {
    badgeClass =
      "bg-[#E8F5ED] text-[#0E9351]";
  } else if (type === "Stock Transfer") {
    badgeClass =
      "bg-[#F7EFD8] text-[#9A7B1F]";
  } else if (type === "Pricing") {
    badgeClass =
      "bg-[#F3F4F2] text-[#66736B]";
  }

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-2
        py-0.5
        text-[9px]
        font-semibold
        ${badgeClass}
      `}
    >
      {type || "Unknown"}
    </span>
  );
}


/* ================================================================
   PENDING CHALLAN MODAL
================================================================ */

interface PendingChallanModalProps {
  open: boolean;
  challans: PendingChallan[];
  loading: boolean;
  onClose: () => void;
  onSelect: (challan: PendingChallan) => void;
}

function PendingChallanModal({
  open,
  challans,
  loading,
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

        {/* HEADER */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-[#E6EAE3]
            bg-[#F1F8F3]
            px-4
            py-3
          "
        >
          <div className="flex items-center gap-2">

            <div
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-md
                bg-[#10673E]
                text-white
              "
            >
              <ClipboardList size={14} />
            </div>

            <div>
              <h2
                className="
                  text-sm
                  font-semibold
                  text-[#17231D]
                "
              >
                Pending Challans
              </h2>

              <p
                className="
                  text-[9px]
                  text-[#66736B]
                "
              >
                {loading
                  ? "Loading challans..."
                  : `${challans.length} challans awaiting receive`}
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


        {/* BODY */}

        <div className="min-h-0 flex-1 overflow-auto">

          {loading ? (
            <div
              className="
                flex
                min-h-[220px]
                items-center
                justify-center
                text-xs
                text-[#66736B]
              "
            >
              Loading pending challans...
            </div>
          ) : challans.length === 0 ? (
            <div
              className="
                flex
                min-h-[220px]
                flex-col
                items-center
                justify-center
                text-[#9AA29C]
              "
            >
              <ClipboardList size={30} />

              <p className="mt-2 text-xs font-medium">
                No pending challans found
              </p>

              <p className="mt-1 text-[10px]">
                All challans may already be received.
              </p>
            </div>
          ) : (
            <table
              className="
                w-full
                min-w-[560px]
                border-collapse
                text-xs
              "
            >
              <thead
                className="
                  sticky
                  top-0
                  z-10
                  bg-[#10673E]
                  text-white
                "
              >
                <tr>
                  <th
                    className="
                      px-3
                      py-2.5
                      text-left
                      text-[10px]
                      font-semibold
                    "
                  >
                    Type
                  </th>

                  <th
                    className="
                      px-3
                      py-2.5
                      text-left
                      text-[10px]
                      font-semibold
                    "
                  >
                    Challan No.
                  </th>

                  <th
                    className="
                      px-3
                      py-2.5
                      text-left
                      text-[10px]
                      font-semibold
                    "
                  >
                    Challan Time
                  </th>
                </tr>
              </thead>

              <tbody>
                {challans.map((challan) => (
                  <tr
                    key={challan.referenceNumber}
                    onClick={() => onSelect(challan)}
                    title="Click to select this challan"
                    className="
                      cursor-pointer
                      border-b
                      border-[#ECEFEA]
                      transition-colors
                      hover:bg-[#F1F8F3]
                    "
                  >
                    <td className="px-3 py-2.5">
                      <TypeBadge
                        type={challan.productInType}
                      />
                    </td>

                    <td
                      className="
                        px-3
                        py-2.5
                        font-mono
                        text-[11px]
                        font-semibold
                        text-[#17231D]
                      "
                    >
                      {challan.referenceNumber}
                    </td>

                    <td
                      className="
                        px-3
                        py-2.5
                        text-[#66736B]
                      "
                    >
                      {challan.inDate
                        ? new Date(
                            challan.inDate
                          ).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>


        {/* FOOTER */}

        <div
          className="
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
          "
        >
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


/* ================================================================
   PRODUCT RECEIVE
================================================================ */

function ProductReceive() {

  /* ==============================================================
     FORM STATE
  ============================================================== */

  const [deliveryType, setDeliveryType] =
    useState<string>("");

  const [orderNo, setOrderNo] =
    useState("");

  /*
   * Your current API does NOT return deliveryFrom.
   *
   * Therefore we intentionally do not use a fake/static value
   * such as "Head Office".
   */
  const [deliveryFrom] =
    useState("");


  /* ==============================================================
     PENDING CHALLAN STATE
  ============================================================== */

  const [pendingChallans, setPendingChallans] =
    useState<PendingChallan[]>([]);

  const [isLoadingChallans, setIsLoadingChallans] =
    useState(false);


  /* ==============================================================
     ACTIVE CHALLAN
  ============================================================== */

  const [activeChallan, setActiveChallan] =
    useState<PendingChallan | null>(null);

  const [items, setItems] =
    useState<ReceiveItem[]>([]);

  const [isLoadingProducts, setIsLoadingProducts] =
    useState(false);


  /* ==============================================================
     REMARKS
  ============================================================== */

  const [sendRemarks, setSendRemarks] =
    useState("");

  const [remarks, setRemarks] =
    useState("");


  /* ==============================================================
     UI STATE
  ============================================================== */

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [isReceiving, setIsReceiving] =
    useState(false);

  const [toast, setToast] =
    useState<Toast>(null);


  /* ==============================================================
     TOAST
  ============================================================== */

  const showToast = useCallback(
    (
      message: string,
      type: "success" | "error"
    ) => {
      setToast({
        message,
        type,
      });

      window.setTimeout(() => {
        setToast(null);
      }, 2600);
    },
    []
  );


  /* ==============================================================
     LOAD PENDING CHALLANS
  ============================================================== */

  const loadPendingChallans = useCallback(
    async () => {
      try {
        setIsLoadingChallans(true);

        const response =
          await getPendingChallans();

        if (!response.success) {
          showToast(
            response.message ||
              "Failed to load pending challans",
            "error"
          );

          setPendingChallans([]);
          return;
        }

        setPendingChallans(
          response.data
        );

      } catch (error) {
        console.error(
          "Failed to load pending challans:",
          error
        );

        showToast(
          "Failed to load pending challans",
          "error"
        );

        setPendingChallans([]);

      } finally {
        setIsLoadingChallans(false);
      }
    },
    [showToast]
  );


  /* ==============================================================
     INITIAL API LOAD
  ============================================================== */

  useEffect(() => {
    loadPendingChallans();
  }, [loadPendingChallans]);


  /* ==============================================================
     DELIVERY TYPE OPTIONS
  ============================================================== */

  const deliveryTypeOptions = Array.from(
    new Set(
      pendingChallans
        .map(
          (challan) =>
            challan.productInType
        )
        .filter(Boolean)
    )
  );


  /* ==============================================================
     LOAD PRODUCT DETAILS
  ============================================================== */

  const loadChallan = async (
    challan: PendingChallan
  ) => {

    try {

      setIsLoadingProducts(true);

      setDeliveryType(
        challan.productInType
      );

      setOrderNo(
        challan.referenceNumber
      );

      setSendRemarks(
        challan.senderRemarks ?? ""
      );

      setActiveChallan(challan);

      setItems([]);

      /*
       * The pending-chalans API does not
       * contain product items.
       *
       * Therefore we call:
       *
       * GET /by-reference/{referenceNumber}
       */
      const response =
        await getProductReceiveByReference(
          challan.referenceNumber
        );

      if (!response.success) {

        showToast(
          response.message ||
            "Failed to load product details",
          "error"
        );

        setItems([]);

        return;
      }

      /*
       * Use the quantity returned by the API.
       *
       * If the API returns receivedQty = 0,
       * it remains 0.
       *
       * We do NOT use static challanQty here.
       */
      setItems(
        response.data.map((item) => ({
          ...item,
          receivedQty:
            Number(item.receivedQty) || 0,
        }))
      );

    } catch (error) {

      console.error(
        "Failed to load challan details:",
        error
      );

      showToast(
        "Failed to load challan details",
        "error"
      );

      setItems([]);

    } finally {

      setIsLoadingProducts(false);

    }
  };


  /* ==============================================================
     LOAD BUTTON
  ============================================================== */

  const handleLoad = async () => {

    const order =
      orderNo.trim();

    if (!order) {

      showToast(
        "Enter a Deliver Order No. first",
        "error"
      );

      return;
    }

    const match =
      pendingChallans.find(
        (challan) =>
          challan.referenceNumber
            .toLowerCase() ===
          order.toLowerCase()
      );

    if (!match) {

      showToast(
        "No pending challan found for this order no.",
        "error"
      );

      return;
    }

    await loadChallan(match);

    showToast(
      `Challan ${match.referenceNumber} loaded`,
      "success"
    );
  };


  /* ==============================================================
     CLEAR ORDER
  ============================================================== */

  const handleClearOrder = () => {

    setOrderNo("");

    setDeliveryType("");

    setActiveChallan(null);

    setItems([]);

    setSendRemarks("");

    setRemarks("");
  };


  /* ==============================================================
     SELECT CHALLAN FROM MODAL
  ============================================================== */

  const handleSelectChallan = async (
    challan: PendingChallan
  ) => {

    setIsModalOpen(false);

    await loadChallan(challan);

    showToast(
      `Challan ${challan.referenceNumber} loaded`,
      "success"
    );
  };


  /* ==============================================================
     RECEIVED QUANTITY
  ============================================================== */

  const handleReceivedQty = (
    productId: number,
    value: string
  ) => {

    const quantity =
      Math.max(
        0,
        Number(value) || 0
      );

    setItems(
      (previousItems) =>
        previousItems.map(
          (item) =>
            item.productId ===
            productId
              ? {
                  ...item,
                  receivedQty:
                    quantity,
                }
              : item
        )
    );
  };


  /* ==============================================================
     CALCULATIONS
  ============================================================== */

  const totalChallanQty =
    items.reduce(
      (total, item) =>
        total +
        (Number(item.challanQty) || 0),
      0
    );

  const totalReceivedQty =
    items.reduce(
      (total, item) =>
        total +
        (Number(item.receivedQty) || 0),
      0
    );


  /* ==============================================================
     RECEIVE
  ============================================================== */

  const handleReceive = async () => {

    if (!activeChallan) {

      showToast(
        "Load a challan first",
        "error"
      );

      return;
    }

    if (items.length === 0) {

      showToast(
        "Nothing to receive",
        "error"
      );

      return;
    }

    /*
     * IMPORTANT:
     *
     * Your current backend contract only accepts:
     *
     * {
     *   referenceNumber,
     *   receiverRemarks
     * }
     *
     * It does NOT accept receivedQty.
     */

    try {

      setIsReceiving(true);

      const response = await receiveChalan({
  master: {
    referenceNumber: activeChallan.referenceNumber,
    receiverRemarks: remarks.trim(),
  },

  details: items.map((item) => ({
    productId: item.productId,
    barcode: item.barcode,
    receivedQty: item.receivedQty,
  })),
});

      if (!response.success) {

        showToast(
          response.message ||
            "Failed to receive challan",
          "error"
        );

        return;
      }

      showToast(
        response.message ||
          `Challan ${activeChallan.referenceNumber} received successfully`,
        "success"
      );

      /*
       * Clear current challan.
       */
      setActiveChallan(null);

      setItems([]);

      setOrderNo("");

      setDeliveryType("");

      setSendRemarks("");

      setRemarks("");

      /*
       * Refresh pending challans.
       *
       * The received challan should disappear
       * if the backend marks it as received.
       */
      await loadPendingChallans();

    } catch (error) {

      console.error(
        "Failed to receive challan:",
        error
      );

      showToast(
        "Failed to receive challan",
        "error"
      );

    } finally {

      setIsReceiving(false);

    }
  };


  /* ==============================================================
     DOWNLOAD / EXPORT
  ============================================================== */

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

    const rows =
      items.map((item) => [
        item.shortName,
        item.fullName,
        item.barcode,
        String(item.challanQty),
        String(item.receivedQty),
        Number(item.salesPrice).toFixed(2),
      ]);

    const totalsRow = [
      "Total Quantity",
      "",
      "",
      String(totalChallanQty),
      String(totalReceivedQty),
      "",
    ];

    const csv =
      [header, ...rows, totalsRow]
        .map((row) =>
          row
            .map(
              (cell) =>
                `"${String(cell).replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(",")
        )
        .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "product-receive.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showToast(
      "Report exported successfully",
      "success"
    );
  };


  /* ==============================================================
     UI
  ============================================================== */

  return (
    <div
      className="
        flex
        h-full
        min-h-0
        w-full
        flex-col
        overflow-hidden
        bg-[#F5F7F3]
        text-[#17231D]
      "
    >

      <style>{`
        @keyframes pr-fade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes pr-pop {
          from {
            opacity: 0;
            transform:
              translateY(8px)
              scale(0.98);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }
      `}</style>


      {/* =========================================================
          PAGE HEADER
      ========================================================= */}

      <header
        className="
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
        "
      >

        <div className="flex items-center gap-2">

          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-md
              bg-[#10673E]
              text-white
            "
          >
            <PackageCheck size={16} />
          </div>

          <div>

            <h1
              className="
                text-sm
                font-semibold
                leading-none
                text-[#17231D]
              "
            >
              Product Receive
            </h1>

            <p
              className="
                mt-0.5
                text-[9px]
                text-[#66736B]
              "
            >
              Receive goods against pending
              challans
            </p>

          </div>

        </div>


        <div className="flex items-center gap-1.5">

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


      {/* =========================================================
          FORM CONTROLS
      ========================================================= */}

      <section
        className="
          shrink-0
          border-b
          border-[#DDE5DF]
          bg-white
          px-[clamp(8px,1vw,16px)]
          py-2.5
        "
      >

        <div
          className="
            grid
            grid-cols-1
            gap-2
            md:grid-cols-2
            xl:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1.2fr)]
          "
        >

          {/* DELIVERY TYPE */}

          <Field
            label="Delivery Type"
            icon={<Truck size={13} />}
          >

            <select
              value={deliveryType}
              onChange={(e) =>
                setDeliveryType(
                  e.target.value
                )
              }
              className={`
                ${smallInputClass}
                ${
                  deliveryType
                    ? ""
                    : "text-[#9AA29C]"
                }
              `}
            >

              <option value="">
                Select delivery type
              </option>

              {deliveryTypeOptions.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                )
              )}

            </select>

          </Field>


          {/* ORDER NO */}

          <Field
            label="Deliver Order No."
            icon={<Hash size={13} />}
          >

            <div
              className="
                flex
                items-center
                gap-1.5
              "
            >

              <div
                className="
                  relative
                  min-w-0
                  flex-1
                "
              >

                <input
                  value={orderNo}
                  onChange={(e) =>
                    setOrderNo(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter"
                    ) {
                      handleLoad();
                    }
                  }}
                  className={`
                    ${smallInputClass}
                    pr-8
                    font-mono
                  `}
                  placeholder="e.g. VR2622-1"
                />

                {orderNo && (
                  <button
                    type="button"
                    onClick={
                      handleClearOrder
                    }
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
                disabled={
                  isLoadingProducts
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
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <Search size={13} />

                {isLoadingProducts
                  ? "Loading..."
                  : "Load"}
              </button>

            </div>

          </Field>


          {/* DELIVERY FROM */}

         


          {/* SENDER REMARKS */}

      

        </div>

      </section>


      {/* =========================================================
          PRODUCT TABLE
      ========================================================= */}

      <section
        className="
          flex
          min-h-0
          min-w-0
          flex-1
          flex-col
          overflow-hidden
          bg-white
        "
      >

        {activeChallan ? (

          <>

            {/* TABLE HEADER */}

            <div
              className="
                flex
                h-9
                shrink-0
                items-center
                justify-between
                border-b
                border-[#DDE5DF]
                bg-[#F1F8F3]
                px-[clamp(8px,1vw,16px)]
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <PackageCheck
                  size={14}
                  className="text-[#10673E]"
                />

                <span
                  className="
                    text-xs
                    font-semibold
                    text-[#17231D]
                  "
                >
                  Product Table
                </span>

                <TypeBadge
                  type={
                    activeChallan.productInType
                  }
                />

                <span
                  className="
                    rounded
                    border
                    border-[#ECEFEA]
                    bg-white
                    px-1.5
                    py-0.5
                    font-mono
                    text-[9px]
                    text-[#66736B]
                  "
                >
                  {
                    activeChallan.referenceNumber
                  }
                </span>

              </div>


              <span
                className="
                  text-[10px]
                  text-[#66736B]
                "
              >
                {items.length} items ·{" "}
                {totalReceivedQty} /{" "}
                {totalChallanQty} units
              </span>

            </div>


            {/* TABLE */}

            <div
              className="
                min-h-0
                flex-1
                overflow-auto
              "
            >

              {isLoadingProducts ? (

                <div
                  className="
                    flex
                    h-full
                    min-h-[200px]
                    items-center
                    justify-center
                    text-xs
                    text-[#66736B]
                  "
                >
                  Loading product details...
                </div>

              ) : items.length === 0 ? (

                <div
                  className="
                    flex
                    h-full
                    min-h-[200px]
                    flex-col
                    items-center
                    justify-center
                    text-[#9AA29C]
                  "
                >
                  <Boxes
                    size={30}
                    strokeWidth={1.5}
                  />

                  <p
                    className="
                      mt-2
                      text-xs
                      font-medium
                    "
                  >
                    No products found
                  </p>
                </div>

              ) : (

                <table
                  className="
                    w-full
                    min-w-[760px]
                    border-collapse
                    text-xs
                  "
                >

                  <thead
                    className="
                      sticky
                      top-0
                      z-10
                      bg-[#10673E]
                      text-white
                    "
                  >

                    <tr>

                      <th
                        className="
                          px-3
                          py-2.5
                          text-left
                          text-[10px]
                          font-semibold
                        "
                      >
                        Product Name
                      </th>

                      <th
                        className="
                          px-3
                          py-2.5
                          text-left
                          text-[10px]
                          font-semibold
                        "
                      >
                        Description
                      </th>

                      <th
                        className="
                          px-3
                          py-2.5
                          text-left
                          text-[10px]
                          font-semibold
                        "
                      >
                        Barcode
                      </th>

                      <th
                        className="
                          px-3
                          py-2.5
                          text-center
                          text-[10px]
                          font-semibold
                        "
                      >
                        Challan Qty
                      </th>

                      <th
                        className="
                          px-3
                          py-2.5
                          text-center
                          text-[10px]
                          font-semibold
                        "
                      >
                        Received Qty
                      </th>

                      <th
                        className="
                          px-3
                          py-2.5
                          text-right
                          text-[10px]
                          font-semibold
                        "
                      >
                        Price
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {items.map(
                      (item) => (
                        <tr
                          key={
                            item.productId
                          }
                          className="
                            border-b
                            border-[#ECEFEA]
                            transition-colors
                            hover:bg-[#F1F8F3]
                          "
                        >

                          <td
                            className="
                              px-3
                              py-2
                              font-medium
                              text-[#17231D]
                            "
                          >
                            {item.shortName}
                          </td>


                          <td
                            className="
                              px-3
                              py-2
                              text-[#66736B]
                            "
                          >
                            {item.fullName}
                          </td>


                          <td
                            className="
                              px-3
                              py-2
                              font-mono
                              text-[11px]
                              text-[#66736B]
                            "
                          >
                            {item.barcode}
                          </td>


                          <td
                            className="
                              px-3
                              py-2
                              text-center
                              font-medium
                              tabular-nums
                              text-[#66736B]
                            "
                          >
                            {item.challanQty}
                          </td>


                          <td
                            className="
                              px-3
                              py-2
                              text-center
                            "
                          >

                            <input
                              type="number"
                              min={0}
                              value={
                                item.receivedQty
                              }
                              onChange={(e) =>
                                handleReceivedQty(
                                  item.productId,
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


                          <td
                            className="
                              px-3
                              py-2
                              text-right
                              font-medium
                              tabular-nums
                              text-[#17231D]
                            "
                          >
                            {Number(
                              item.salesPrice
                            ).toFixed(2)}
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>


                  <tfoot
                    className="
                      sticky
                      bottom-0
                      z-10
                      border-t-2
                      border-[#10673E]
                      bg-[#F1F8F3]
                    "
                  >

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


                      <td
                        className="
                          px-3
                          py-2.5
                          text-center
                          text-xs
                          font-bold
                          tabular-nums
                          text-[#17231D]
                        "
                      >
                        {totalChallanQty}
                      </td>


                      <td
                        className="
                          px-3
                          py-2.5
                          text-center
                          text-xs
                          font-bold
                          tabular-nums
                          text-[#10673E]
                        "
                      >
                        {totalReceivedQty}
                      </td>


                      <td className="px-3 py-2.5" />

                    </tr>

                  </tfoot>

                </table>

              )}

            </div>

          </>

        ) : (

          /* EMPTY STATE */

          <div
            className="
              flex
              flex-1
              flex-col
              items-center
              justify-center
              px-4
              text-[#9AA29C]
            "
          >

            <Boxes
              size={30}
              strokeWidth={1.5}
            />

            <p
              className="
                mt-2
                text-xs
                font-medium
              "
            >
              No challan loaded
            </p>

            <p
              className="
                mt-1
                text-[10px]
              "
            >
              Select a pending challan or
              enter an order no. and press Load
            </p>

          </div>

        )}

      </section>


      {/* =========================================================
          BOTTOM ACTION AREA
      ========================================================= */}

      <footer
        className="
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
        "
      >

        <div
          className="
            grid
            min-w-0
            flex-1
            grid-cols-1
            gap-2
            md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]
          "
        >

          {/* RECEIVER REMARKS */}
            <div className="min-w-0">

            <label
              className="
                mb-1
                flex
                items-center
                gap-1
                text-[10px]
                font-semibold
                text-[#66736B]
              "
            >
              Sender Remarks
            </label>

            <textarea
              value={sendRemarks}
              readOnly
              rows={2}
              placeholder="Fetched from API"
              className="
                h-14
                w-full
                resize-none
                cursor-not-allowed
                rounded-md
                border
                border-[#E3E7E0]
                bg-[#F3F4F2]
                px-2.5
                py-1.5
                text-xs
                text-[#66736B]
                outline-none
                transition
                placeholder:text-[#9AA29C]
              "
            />

          </div>
          <div className="min-w-0">

            <label
              className="
                mb-1
                flex
                items-center
                gap-1
                text-[10px]
                font-semibold
                text-[#66736B]
              "
            >
              Receiver Remarks
            </label>

            <textarea
              value={remarks}
              onChange={(e) =>
                setRemarks(
                  e.target.value
                )
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


          {/* SENDER REMARKS */}

          

        </div>


        {/* RECEIVE BUTTON */}

        <button
          type="button"
          onClick={handleReceive}
          disabled={
            isReceiving ||
            !activeChallan ||
            items.length === 0
          }
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
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >

          <PackageCheck size={17} />

          {isReceiving
            ? "Receiving..."
            : "Receive"}

        </button>

      </footer>


      {/* =========================================================
          PENDING CHALLAN MODAL
      ========================================================= */}

      <PendingChallanModal
        open={isModalOpen}
        challans={pendingChallans}
        loading={isLoadingChallans}
        onClose={() =>
          setIsModalOpen(false)
        }
        onSelect={
          handleSelectChallan
        }
      />


      {/* =========================================================
          TOAST
      ========================================================= */}

      {toast && (
        <div
          className="
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
          "
        >

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