import {
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Gift,
  Inbox,
  ScanSearch,
  Trash2,
  X,
} from "lucide-react";

import { useCallback, useState } from "react";


// ======================================================
// TYPES
// ======================================================

interface GiftVoucherRow {
  id: number;
  serial: string;
  validityDate: string;
  originalValue: number;
  status: string;
  addedBy: string;
}

interface PendingChallan {
  challanNo: string;
  receivedFrom: string;
  date: string;
  voucherCount: number;
}

type Toast =
  | {
      message: string;
      type: "success" | "error";
    }
  | null;


// ======================================================
// CONSTANTS
// ======================================================

const receivedFromOptions = [
  "Customer",
  "Partner",
  "Other",
];

/*
 * Prototype data — replace with the challan APIs once available
 * (load challan by no / pending challan list).
 */
const PENDING_CHALLANS: PendingChallan[] = [
  {
    challanNo: "CH-2026-0011",
    receivedFrom: "Customer",
    date: "2026-09-20",
    voucherCount: 4,
  },
  {
    challanNo: "CH-2026-0014",
    receivedFrom: "Partner",
    date: "2026-09-24",
    voucherCount: 2,
  },
];

function buildDemoChallanRows(
  challanNo: string
): GiftVoucherRow[] {

  const suffix = challanNo.replace(
    /[^0-9]/g,
    ""
  );

  const seed = Number(suffix) || 1;

  return [
    {
      id: 1,
      serial: `GV-${100000 + seed * 7}`,
      validityDate: "2027-03-01",
      originalValue: 1000,
      status: "New",
      addedBy: "Cashier",
    },
    {
      id: 2,
      serial: `GV-${200000 + seed * 13}`,
      validityDate: "2027-03-01",
      originalValue: 1000,
      status: "New",
      addedBy: "Cashier",
    },
    {
      id: 3,
      serial: `GV-${300000 + seed * 17}`,
      validityDate: "2027-03-01",
      originalValue: 500,
      status: "New",
      addedBy: "Cashier",
    },
  ];
}


// ======================================================
// REUSABLE STYLES
// ======================================================

const smallInputClass = `
  h-9
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


// ======================================================
// FIELD
// ======================================================

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({
  label,
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

        {label}

      </label>

      {children}

    </div>
  );
}


// ======================================================
// GIFT VOUCHER RECEIVE (MAIN)
// ======================================================

function GiftVoucherReceive() {

  // ====================================================
  // FORM STATE
  // ====================================================

  const [receivedFrom, setReceivedFrom] =
    useState("");

  const [challanNo, setChallanNo] =
    useState("");


  // ====================================================
  // VOUCHER LIST STATE
  // ====================================================

  const [rows, setRows] =
    useState<GiftVoucherRow[]>([]);

  const [loadedChallanNo, setLoadedChallanNo] =
    useState<string | null>(null);


  // ====================================================
  // UI STATE
  // ====================================================

  const [toast, setToast] = useState<Toast>(null);

  const [
    pendingChallanOpen,
    setPendingChallanOpen,
  ] = useState(false);


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

  const handleLoad = () => {

    const challan = challanNo.trim();

    if (!challan) {
      showToast(
        "Challan No is required",
        "error"
      );
      return;
    }

    if (!receivedFrom) {
      showToast(
        "Please select Receive From",
        "error"
      );
      return;
    }

    /*
     * TODO: replace with the challan API once available —
     * fetch vouchers of `challan` and put them into `rows`.
     */
    const loaded = buildDemoChallanRows(challan);

    setRows(loaded);
    setLoadedChallanNo(challan);

    showToast(
      `Challan ${challan} loaded — ${loaded.length} vouchers`,
      "success"
    );
  };


  // ====================================================
  // PENDING CHALLAN PICKER
  // ====================================================

  const handlePickPendingChallan = (
    challan: PendingChallan
  ) => {

    setChallanNo(challan.challanNo);
    setReceivedFrom(challan.receivedFrom);
    setPendingChallanOpen(false);

    showToast(
      `Challan ${challan.challanNo} selected — press Load`,
      "success"
    );
  };


  // ====================================================
  // REMOVE VOUCHER
  // ====================================================

  const handleRemove = (id: number) => {

    setRows((previousRows) =>
      previousRows.filter(
        (row) => row.id !== id
      )
    );
  };


  // ====================================================
  // CALCULATIONS
  // ====================================================

  const totalValue = rows.reduce(
    (total, row) =>
      total + row.originalValue,
    0
  );


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


      {/* ================================================= */}
      {/* HEADER BAR */}
      {/* ================================================= */}

      <header className="
        flex
        shrink-0
        flex-wrap
        items-center
        justify-between
        gap-2
        bg-[#10673E]
        px-[clamp(8px,1vw,16px)]
        py-2
        text-white
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
            bg-white/10
          ">
            <Gift size={16} />
          </div>

          <div>

            <h1 className="
              text-sm
              font-semibold
              leading-none
            ">
              Gift Voucher Receive
            </h1>

            <p className="
              mt-0.5
              text-[9px]
              text-white/60
            ">
              Receive gift vouchers from
              branches &amp; partners
            </p>

          </div>

        </div>


        <button
          type="button"
          onClick={() =>
            setPendingChallanOpen(true)
          }
          className="
            inline-flex
            h-8
            items-center
            justify-center
            gap-1.5
            rounded-md
            bg-white
            px-3.5
            text-[10px]
            font-semibold
            text-[#10673E]
            transition
            hover:bg-[#E8F5ED]
            active:scale-[0.98]
          "
        >
          <Inbox size={14} />
          Pending Challan
        </button>

      </header>


      {/* ================================================= */}
      {/* CHALLAN DETAILS CARD */}
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
          items-end
          gap-2
          md:grid-cols-[1fr_1fr_auto_auto]
        ">

          <Field label="Receive From">

            <select
              value={receivedFrom}
              onChange={(e) =>
                setReceivedFrom(e.target.value)
              }
              className={`
                ${smallInputClass}
                ${
                  receivedFrom
                    ? ""
                    : "text-[#9AA29C]"
                }
              `}
            >
              <option value="" disabled>
                Select
              </option>

              {receivedFromOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}

            </select>

          </Field>


          <Field label="Challan No">

            <input
              type="text"
              value={challanNo}
              onChange={(e) =>
                setChallanNo(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLoad();
                }
              }}
              className={smallInputClass}
              placeholder="Challan No"
            />

          </Field>


          <button
            type="button"
            onClick={handleLoad}
            className="
              inline-flex
              h-9
              items-center
              justify-center
              gap-1.5
              rounded-md
              bg-[#0E9351]
              px-4
              text-xs
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-[#10673E]
              active:scale-[0.98]
            "
          >
            <ScanSearch size={14} />
            Load
          </button>


          <button
            type="button"
            onClick={() =>
              setPendingChallanOpen(true)
            }
            className="
              inline-flex
              h-9
              items-center
              justify-center
              gap-1.5
              rounded-md
              border
              border-[#0E9351]/40
              bg-[#E8F5ED]
              px-4
              text-xs
              font-semibold
              text-[#10673E]
              transition
              hover:bg-[#D4EDDA]
              active:scale-[0.98]
            "
          >
            <Inbox size={14} />
            Pending Challan
          </button>

        </div>

      </section>


      {/* ================================================= */}
      {/* VOUCHER LIST TABLE CARD */}
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

            <Gift
              size={14}
              className="text-[#10673E]"
            />

            <span className="
              text-xs
              font-semibold
              text-[#10673E]
            ">
              Voucher List
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
              {rows.length}
            </span>

            {loadedChallanNo && (
              <span className="
                rounded-full
                bg-[#2D5597]/10
                px-2
                py-0.5
                text-[9px]
                font-semibold
                text-[#2D5597]
              ">
                Challan {loadedChallanNo}
              </span>
            )}

          </div>

          <span className="
            text-[10px]
            text-[#66736B]
          ">
            {totalValue.toFixed(2)} BDT total
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
                  Voucher Serial
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Validity Date
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-right
                  text-[10px]
                  font-semibold
                ">
                  Original Value
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-center
                  text-[10px]
                  font-semibold
                ">
                  Current Status
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

              {rows.length === 0 ? (

                <tr>

                  <td
                    colSpan={6}
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

                      <ClipboardList
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
                        Enter a Challan No and press
                        Load, or pick one from
                        Pending Challan
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                rows.map((row, index) => (

                  <tr
                    key={row.id}
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
                      font-medium
                      text-[#17231D]
                    ">
                      {row.serial}
                    </td>

                    <td className="
                      px-3
                      py-2
                      text-[#66736B]
                    ">
                      {formatDate(row.validityDate)}
                    </td>

                    <td className="
                      px-3
                      py-2
                      text-right
                      font-semibold
                      tabular-nums
                      text-[#10673E]
                    ">
                      {row.originalValue.toFixed(2)}
                    </td>

                    <td className="
                      px-3
                      py-2
                      text-center
                    ">

                      <span className="
                        inline-flex
                        items-center
                        rounded-full
                        bg-[#E8F5ED]
                        px-2
                        py-0.5
                        text-[9px]
                        font-semibold
                        text-[#0E9351]
                      ">
                        {row.status}
                      </span>

                    </td>

                    <td className="
                      px-3
                      py-2
                      text-center
                    ">

                      <button
                        type="button"
                        onClick={() =>
                          handleRemove(row.id)
                        }
                        title="Remove voucher"
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
                        <Trash2 size={14} />
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
      {/* PENDING CHALLAN MODAL */}
      {/* ================================================= */}

      {pendingChallanOpen && (

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
          "
          onClick={() =>
            setPendingChallanOpen(false)
          }
        >

          <div
            className="
              w-full
              max-w-lg
              overflow-hidden
              rounded-xl
              bg-white
              shadow-2xl
            "
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}

            <div className="
              flex
              items-center
              justify-between
              border-b
              border-[#DDE5DF]
              px-5
              py-3.5
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
                  bg-[#10673E]/10
                  text-[#10673E]
                ">
                  <Inbox size={15} />
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
                    text-[10px]
                    text-[#9AA29C]
                  ">
                    Select a challan to fill the form
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setPendingChallanOpen(false)
                }
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-md
                  text-[#9AA29C]
                  transition
                  hover:bg-[#F1F8F3]
                  hover:text-[#66736B]
                "
              >
                <X size={16} />
              </button>

            </div>


            {/* Modal Body */}

            <div className="
              max-h-80
              overflow-y-auto
            ">

              {PENDING_CHALLANS.length === 0 ? (

                <div className="
                  flex
                  flex-col
                  items-center
                  justify-center
                  py-12
                  text-[#9AA29C]
                ">

                  <Inbox
                    size={28}
                    strokeWidth={1.5}
                  />

                  <p className="
                    mt-2
                    text-xs
                    font-medium
                  ">
                    No pending challans
                  </p>

                </div>

              ) : (

                <ul className="
                  divide-y
                  divide-[#ECEFEA]
                ">

                  {PENDING_CHALLANS.map((challan) => (

                    <li key={challan.challanNo}>

                      <button
                        type="button"
                        onClick={() =>
                          handlePickPendingChallan(challan)
                        }
                        className="
                          flex
                          w-full
                          items-center
                          justify-between
                          gap-3
                          px-5
                          py-3
                          text-left
                          transition
                          hover:bg-[#F1F8F3]
                        "
                      >

                        <span className="
                          font-mono
                          text-xs
                          font-semibold
                          text-[#17231D]
                        ">
                          {challan.challanNo}
                        </span>

                        <span className="
                          flex
                          items-center
                          gap-3
                          text-[10px]
                          text-[#66736B]
                        ">

                          <span>
                            {challan.receivedFrom}
                          </span>

                          <span>
                            {formatDate(challan.date)}
                          </span>

                          <span className="
                            rounded-full
                            bg-[#E8F5ED]
                            px-2
                            py-0.5
                            font-semibold
                            text-[#0E9351]
                          ">
                            {challan.voucherCount} vouchers
                          </span>

                        </span>

                      </button>

                    </li>

                  ))}

                </ul>

              )}

            </div>

          </div>

        </div>

      )}


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

export default GiftVoucherReceive;
