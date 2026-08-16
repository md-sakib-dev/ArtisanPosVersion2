import {
  Barcode,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Gift,
  Hash,
  MessageSquare,
  Save,
  ScanLine,
  Trash2,
  Wallet,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";


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

type Toast =
  | {
      message: string;
      type: "success" | "error";
    }
  | null;


// ======================================================
// CONSTANTS
// ======================================================

const VOUCHER_DEFAULT_VALUE = 1000;

const locationOptions = [
  "Head Office",
  "Dhaka Branch",
  "Other",
];

const receivedFromOptions = [
  "Customer",
  "Partner",
  "Other",
];


// ======================================================
// REUSABLE STYLES
// ======================================================

const smallInputClass = `
  h-8
  w-full
  rounded-md
  border
  border-[#D5DBD2]
  bg-white
  px-2.5
  text-xs
  text-[#263027]
  outline-none
  transition
  placeholder:text-[#9AA29C]
  focus:border-[#596B4F]
  focus:ring-2
  focus:ring-[#596B4F]/10
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
  text-[#687269]
  outline-none
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

function addMonths(
  iso: string,
  months: number
): string {

  const date = iso
    ? new Date(iso)
    : new Date();

  date.setMonth(date.getMonth() + months);

  return date.toISOString().slice(0, 10);
}

function generateScanSerial(): string {
  return `GV-${Math.floor(
    100000 + Math.random() * 900000
  )}`;
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
        text-[#687269]
      ">

        {icon}

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

  const [serialInput, setSerialInput] =
    useState("");

  const [receiveDate, setReceiveDate] =
    useState(() =>
      new Date().toISOString().slice(0, 10)
    );

  const [location, setLocation] =
    useState("");

  const [receivedFrom, setReceivedFrom] =
    useState("");

  const [voucherValue, setVoucherValue] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  const serialRef =
    useRef<HTMLInputElement>(null);


  // ====================================================
  // VOUCHER LIST STATE
  // ====================================================

  const [rows, setRows] =
    useState<GiftVoucherRow[]>([]);

  const [nextId, setNextId] = useState(1);


  // ====================================================
  // UI STATE
  // ====================================================

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
  // ADD VOUCHER
  // ====================================================

  const handleAddVoucher = (
    serialOverride?: string
  ) => {

    const serial =
      (serialOverride ?? serialInput).trim();

    if (!serial) {
      showToast(
        "Voucher serial is required",
        "error"
      );
      return;
    }

    if (
      rows.some(
        (row) =>
          row.serial.toLowerCase() ===
          serial.toLowerCase()
      )
    ) {
      showToast(
        "Voucher already added",
        "error"
      );
      return;
    }

    const value =
      Number(voucherValue) ||
      VOUCHER_DEFAULT_VALUE;

    setRows((previousRows) => [
      ...previousRows,
      {
        id: nextId,
        serial,
        validityDate: addMonths(
          receiveDate,
          6
        ),
        originalValue: value,
        status: "New",
        addedBy: "Cashier",
      },
    ]);

    setNextId((id) => id + 1);
    setSerialInput("");
    setVoucherValue("");

    showToast(
      `Voucher ${serial} added`,
      "success"
    );

    serialRef.current?.focus();
  };


  // ====================================================
  // SCAN BARCODE
  // ====================================================

  const handleScan = () => {

    if (serialInput.trim()) {
      handleAddVoucher();
      return;
    }

    const scanned = generateScanSerial();

    showToast(
      `Barcode scanned — ${scanned}`,
      "success"
    );

    handleAddVoucher(scanned);
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
  // SAVE RECEIVE
  // ====================================================

  const handleSave = useCallback(() => {

    if (rows.length === 0) {
      showToast(
        "No vouchers to receive",
        "error"
      );
      return;
    }

    showToast(
      `Received ${rows.length} vouchers (${totalValue.toFixed(2)} BDT)`,
      "success"
    );
  }, [rows, totalValue, showToast]);


  // ====================================================
  // F4 KEYBOARD SHORTCUT
  // ====================================================

  useEffect(() => {

    const onKeyDown = (event: KeyboardEvent) => {

      if (event.key === "F4") {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [handleSave]);


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
      bg-[#F4F1E8]
      text-[#263027]
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
        bg-[#354536]
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
          onClick={handleScan}
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
            text-[#354536]
            transition
            hover:bg-[#E8EDE3]
            active:scale-[0.98]
          "
        >
          <ScanLine size={14} />
          Scan Barcode
        </button>

      </header>


      {/* ================================================= */}
      {/* VOUCHER DETAILS CARD */}
      {/* ================================================= */}

      <section className="
        shrink-0
        border-b
        border-[#D9DED5]
        bg-white
        px-[clamp(8px,1vw,16px)]
        py-2.5
      ">

        {/* ROW 1 */}

        <div className="
          grid
          grid-cols-1
          gap-2
          md:grid-cols-3
        ">

          <Field
            label="Voucher Serial No."
            icon={<Hash size={13} />}
          >

            <div className="relative">

              <input
                ref={serialRef}
                value={serialInput}
                onChange={(e) =>
                  setSerialInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddVoucher();
                  }
                }}
                className={`
                  ${smallInputClass}
                  pr-9
                  font-mono
                `}
                placeholder="Voucher Serial No."
              />

              <Barcode
                size={14}
                className="
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
            label="Receive Date"
            icon={<CalendarDays size={13} />}
          >

            <div className="relative">

              <CalendarDays
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
                type="date"
                value={receiveDate}
                onChange={(e) =>
                  setReceiveDate(e.target.value)
                }
                className={`
                  ${smallInputClass}
                  pl-9
                `}
              />

            </div>

          </Field>


          <Field
            label="Receiving Location"
            icon={<Gift size={13} />}
          >

            <select
              value={location}
              onChange={(e) =>
                setLocation(e.target.value)
              }
              className={`
                ${smallInputClass}
                ${
                  location
                    ? ""
                    : "text-[#9AA29C]"
                }
              `}
            >
              <option value="" disabled>
                Select
              </option>

              {locationOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}

            </select>

          </Field>

        </div>


        {/* ROW 2 */}

        <div className="
          mt-2
          grid
          grid-cols-1
          gap-2
          md:grid-cols-3
        ">

          <Field
            label="Received From"
            icon={<Gift size={13} />}
          >

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


          <Field
            label="Voucher Value (BDT)"
            icon={<Wallet size={13} />}
          >

            <input
              type="number"
              min={0}
              value={voucherValue}
              onChange={(e) =>
                setVoucherValue(e.target.value)
              }
              className={`
                ${smallInputClass}
                text-right
                tabular-nums
              `}
              placeholder="Voucher Value (BDT)"
            />

          </Field>


          <Field
            label="Current Status"
            icon={<CheckCircle2 size={13} />}
          >

            <input
              readOnly
              value="New"
              className={`
                ${readOnlyInputClass}
                font-semibold
                text-[#596B4F]
              `}
            />

          </Field>

        </div>


        {/* ACTION ROW */}

        <div className="
          mt-2.5
          flex
          items-center
          justify-end
        ">

          <button
            type="button"
            onClick={handleSave}
            className="
              inline-flex
              h-9
              items-center
              justify-center
              gap-1.5
              rounded-md
              bg-[#354536]
              px-4
              text-xs
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-[#4E6048]
              active:scale-[0.98]
            "
          >
            <Save size={14} />
            SAVE RECEIVE [F4]
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
        border-[#D9DED5]
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
          border-[#D9DED5]
          bg-[#F8FAF6]
          px-[clamp(8px,1vw,16px)]
        ">

          <div className="
            flex
            items-center
            gap-2
          ">

            <Gift
              size={14}
              className="text-[#354536]"
            />

            <span className="
              text-xs
              font-semibold
              text-[#354536]
            ">
              Voucher List
            </span>

            <span className="
              rounded-full
              bg-[#E5EAE1]
              px-2
              py-0.5
              text-[9px]
              font-semibold
              text-[#596B4F]
            ">
              {rows.length}
            </span>

          </div>

          <span className="
            text-[10px]
            text-[#7A847C]
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
            min-w-[780px]
            border-collapse
            text-xs
          ">

            <thead className="
              sticky
              top-0
              z-10
              bg-[#354536]
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
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Added By
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

                      <Gift
                        size={30}
                        strokeWidth={1.5}
                      />

                      <p className="
                        mt-2
                        text-xs
                        font-medium
                      ">
                        No vouchers received
                      </p>

                      <p className="
                        mt-1
                        text-[10px]
                      ">
                        Scan a barcode or type a
                        serial to add vouchers
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
                      hover:bg-[#F6F8F4]
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
                      text-[#263027]
                    ">
                      {row.serial}
                    </td>

                    <td className="
                      px-3
                      py-2
                      text-[#687269]
                    ">
                      {formatDate(row.validityDate)}
                    </td>

                    <td className="
                      px-3
                      py-2
                      text-right
                      font-semibold
                      tabular-nums
                      text-[#354536]
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
                        bg-[#E5EAE1]
                        px-2
                        py-0.5
                        text-[9px]
                        font-semibold
                        text-[#47734D]
                      ">
                        {row.status}
                      </span>

                    </td>

                    <td className="
                      px-3
                      py-2
                      text-[#667067]
                    ">
                      {row.addedBy}
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
      {/* REMARKS SECTION */}
      {/* ================================================= */}

      <footer className="
        shrink-0
        bg-white
        px-[clamp(8px,1vw,16px)]
        py-2.5
      ">

        <Field
          label="Remarks"
          icon={<MessageSquare size={13} />}
        >

          <div className="relative">

            <input
              value={remarks}
              onChange={(e) =>
                setRemarks(e.target.value)
              }
              className={`
                ${smallInputClass}
                pr-9
              `}
              placeholder="Add remarks for this receive (optional)"
            />

            <MessageSquare
              size={14}
              className="
                absolute
                right-2.5
                top-1/2
                -translate-y-1/2
                text-[#8A938B]
              "
            />

          </div>

        </Field>

      </footer>


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
          border-[#D9DED5]
          bg-[#354536]
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
