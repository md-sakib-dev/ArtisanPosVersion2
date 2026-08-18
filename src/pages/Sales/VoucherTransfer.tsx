import {
  ArrowLeftRight,
  CheckCircle2,
  CircleAlert,
  Hash,
  Plus,
  Save,
  Search,
  Ticket,
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


// ======================================================
// TYPES
// ======================================================

interface VoucherInfo {
  serial: string;
  value: number;
  expiry: string;
}

interface StagedVoucher extends VoucherInfo {
  id: number;
  status: "Active" | "Expired";
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

const destinationOptions = [
  "Dhaka Branch",
  "Chittagong Branch",
  "Sylhet Branch",
  "Warehouse — Mirpur",
  "Warehouse — Narayanganj",
];

const voucherPool: VoucherInfo[] = [
  {
    serial: "GV-100001",
    value: 500,
    expiry: "2026-12-31",
  },
  {
    serial: "GV-100002",
    value: 1000,
    expiry: "2026-10-15",
  },
  {
    serial: "GV-100003",
    value: 2000,
    expiry: "2027-03-20",
  },
  {
    serial: "GV-100004",
    value: 500,
    expiry: "2025-06-30",
  },
  {
    serial: "GV-100005",
    value: 1000,
    expiry: "2026-08-30",
  },
  {
    serial: "GV-100006",
    value: 2000,
    expiry: "2027-06-15",
  },
  {
    serial: "GV-100007",
    value: 500,
    expiry: "2026-11-20",
  },
  {
    serial: "GV-100008",
    value: 1000,
    expiry: "2025-09-10",
  },
];

const VOUCHER_DEFAULT_VALUE = 1000;


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

function getVoucherStatus(
  expiry: string
): "Active" | "Expired" {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(expiry) < today
    ? "Expired"
    : "Active";
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

function StatusBadge({
  status,
}: {
  status: "Active" | "Expired";
}) {

  const active = status === "Active";

  return (
    <span className={`
      inline-flex
      items-center
      rounded-full
      px-2
      py-0.5
      text-[9px]
      font-semibold
      ${
        active
          ? "bg-[#E8F5ED] text-[#0E9351]"
          : "bg-[#FCECEC] text-[#B84A4A]"
      }
    `}>
      {status}
    </span>
  );
}


// ======================================================
// VOUCHER LOOKUP MODAL
// ======================================================

interface VoucherLookupModalProps {
  open: boolean;
  pool: VoucherInfo[];
  stagedSerials: string[];
  onClose: () => void;
  onSelect: (voucher: VoucherInfo) => void;
}

function VoucherLookupModal({
  open,
  pool,
  stagedSerials,
  onClose,
  onSelect,
}: VoucherLookupModalProps) {

  const [query, setQuery] = useState("");

  if (!open) {
    return null;
  }

  const filtered = pool.filter((voucher) =>
    voucher.serial
      .toLowerCase()
      .includes(query.trim().toLowerCase())
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
        animation: "vt-fade 150ms ease-out",
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
          animation: "vt-pop 180ms ease-out",
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
              <Search size={14} />
            </div>

            <div>

              <h2 className="
                text-sm
                font-semibold
                text-[#17231D]
              ">
                Voucher Lookup
              </h2>

              <p className="
                text-[9px]
                text-[#66736B]
              ">
                {pool.length} vouchers available
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


        {/* SEARCH BOX */}

        <div className="
          shrink-0
          border-b
          border-[#ECEFEA]
          bg-white
          px-4
          py-2.5
        ">

          <div className="relative">

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
              placeholder="Search voucher serial…"
            />

          </div>

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
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Voucher Serial
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-right
                  text-[10px]
                  font-semibold
                ">
                  Value
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Expiry Date
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

              {filtered.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="
                      py-10
                      text-center
                      text-[10px]
                      text-[#9AA29C]
                    "
                  >
                    No vouchers match "{query}"
                  </td>

                </tr>

              ) : (

                filtered.map((voucher) => {

                  const status =
                    getVoucherStatus(
                      voucher.expiry
                    );

                  const staged = stagedSerials.some(
                    (serial) =>
                      serial === voucher.serial
                  );

                  return (

                    <tr
                      key={voucher.serial}
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
                        {voucher.serial}
                      </td>

                      <td className="
                        px-3
                        py-2.5
                        text-right
                        font-semibold
                        tabular-nums
                        text-[#10673E]
                      ">
                        {voucher.value.toFixed(2)}
                      </td>

                      <td className="
                        px-3
                        py-2.5
                        text-[#66736B]
                      ">
                        {formatDate(voucher.expiry)}
                      </td>

                      <td className="
                        px-3
                        py-2.5
                        text-center
                      ">
                        <StatusBadge
                          status={status}
                        />
                      </td>

                      <td className="
                        px-3
                        py-2.5
                        text-center
                      ">

                        <button
                          type="button"
                          disabled={staged}
                          onClick={() =>
                            onSelect(voucher)
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
                            disabled:cursor-not-allowed
                            disabled:bg-[#E3E7E0]
                            disabled:text-[#9AA29C]
                          "
                        >
                          <Plus size={12} />
                          {staged ? "Added" : "Select"}
                        </button>

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

        </div>

      </div>

    </div>
  );
}


// ======================================================
// VOUCHER TRANSFER (MAIN)
// ======================================================

function VoucherTransfer() {

  // ====================================================
  // FORM STATE
  // ====================================================

  const [transferTo, setTransferTo] =
    useState("");

  const [serialInput, setSerialInput] =
    useState("");

  const serialRef =
    useRef<HTMLInputElement>(null);


  // ====================================================
  // STAGED VOUCHERS STATE
  // ====================================================

  const [rows, setRows] =
    useState<StagedVoucher[]>([]);

  const [nextId, setNextId] = useState(1);


  // ====================================================
  // UI STATE
  // ====================================================

  const [isLookupOpen, setIsLookupOpen] =
    useState(false);

  const [remarks, setRemarks] =
    useState("");

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

  const stageVoucher = (
    voucher: VoucherInfo
  ) => {

    setRows((previousRows) => {

      const exists = previousRows.some(
        (row) =>
          row.serial === voucher.serial
      );

      if (exists) {
        showToast(
          `Voucher ${voucher.serial} already staged`,
          "error"
        );
        return previousRows;
      }

      return [
        ...previousRows,
        {
          ...voucher,
          id: nextId,
          status: getVoucherStatus(
            voucher.expiry
          ),
        },
      ];
    });

    setNextId((id) => id + 1);
  };

  const handleAdd = () => {

    const serial = serialInput.trim();

    if (!serial) {
      showToast(
        "Enter a voucher serial first",
        "error"
      );
      return;
    }

    const match = voucherPool.find(
      (voucher) =>
        voucher.serial === serial
    );

    const voucher: VoucherInfo = match ?? {
      serial,
      value: VOUCHER_DEFAULT_VALUE,
      expiry: addMonths(
        new Date().toISOString().slice(0, 10),
        6
      ),
    };

    stageVoucher(voucher);
    setSerialInput("");

    showToast(
      `Voucher ${serial} staged`,
      "success"
    );

    serialRef.current?.focus();
  };


  // ====================================================
  // LOOKUP MODAL SELECT
  // ====================================================

  const handleLookupSelect = (
    voucher: VoucherInfo
  ) => {

    stageVoucher(voucher);
    setIsLookupOpen(false);

    showToast(
      `Voucher ${voucher.serial} staged`,
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
    (total, row) => total + row.value,
    0
  );

  const stagedSerials = rows.map(
    (row) => row.serial
  );


  // ====================================================
  // SAVE
  // ====================================================

  const handleSave = useCallback(() => {

    if (rows.length === 0) {
      showToast(
        "No vouchers staged for transfer",
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

    showToast(
      `Transfer saved — ${rows.length} vouchers (${totalValue.toFixed(2)} BDT)`,
      "success"
    );
  }, [rows, totalValue, transferTo, showToast]);


  // ====================================================
  // F2 KEYBOARD SHORTCUT
  // ====================================================

  useEffect(() => {

    const onKeyDown = (event: KeyboardEvent) => {

      if (event.key === "F2") {
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
      bg-[#F5F7F3]
      text-[#17231D]
    ">

      <style>{`
        @keyframes vt-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes vt-pop {
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
              Voucher Transfer
            </h1>

            <p className="
              mt-0.5
              text-[9px]
              text-[#66736B]
            ">
              Transfer vouchers between
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
          <Ticket size={11} />
          {rows.length} vouchers staged
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

        <div className="
          grid
          grid-cols-1
          gap-2
          md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]
        ">

          <Field
            label="Transfer To"
            icon={<Warehouse size={13} />}
          >

            <select
              value={transferTo}
              onChange={(e) =>
                setTransferTo(e.target.value)
              }
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
                Select destination
              </option>

              {destinationOptions.map((option) => (
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
            label="Voucher Serial"
            icon={<Hash size={13} />}
          >

            <input
              ref={serialRef}
              autoFocus
              value={serialInput}
              onChange={(e) =>
                setSerialInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAdd();
                }
              }}
              className={`
                ${smallInputClass}
                font-mono
              `}
              placeholder="Scan or type voucher serial"
            />

          </Field>


          <div className="
            flex
            items-end
            gap-1.5
          ">

            <button
              type="button"
              onClick={handleAdd}
              className="
                inline-flex
                h-8
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
              <Plus size={13} />
              Add
            </button>

            <button
              type="button"
              onClick={() =>
                setIsLookupOpen(true)
              }
              className="
                inline-flex
                h-8
                items-center
                justify-center
                gap-1
                rounded-md
                border
                border-[#DDE5DF]
                bg-white
                px-3
                text-[10px]
                font-semibold
                text-[#10673E]
                transition
                hover:border-[#0E9351]
                hover:bg-[#F1F8F3]
                active:scale-[0.98]
              "
            >
              <Search size={13} />
              SEARCH
            </button>

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* STAGED VOUCHERS TABLE */}
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

            <Ticket
              size={14}
              className="text-[#10673E]"
            />

            <span className="
              text-xs
              font-semibold
              text-[#10673E]
            ">
              Staged Vouchers
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
                  text-right
                  text-[10px]
                  font-semibold
                ">
                  Voucher Value
                </th>

                <th className="
                  px-3
                  py-2.5
                  text-left
                  text-[10px]
                  font-semibold
                ">
                  Expiry Date
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

                      <Ticket
                        size={30}
                        strokeWidth={1.5}
                      />

                      <p className="
                        mt-2
                        text-xs
                        font-medium
                      ">
                        No vouchers staged for transfer
                      </p>

                      <p className="
                        mt-1
                        text-[10px]
                      ">
                        Scan a serial or use
                        SEARCH to add vouchers
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
                      text-right
                      font-semibold
                      tabular-nums
                      text-[#10673E]
                    ">
                      {row.value.toFixed(2)}
                    </td>

                    <td className="
                      px-3
                      py-2
                      text-[#66736B]
                    ">
                      {formatDate(row.expiry)}
                    </td>

                    <td className="
                      px-3
                      py-2
                      text-center
                    ">
                      <StatusBadge
                        status={row.status}
                      />
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
            placeholder="Add transfer notes or dispatch instructions (optional)"
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


        {/* SAVE BUTTON */}

        <button
          type="button"
          onClick={handleSave}
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
          <Save size={16} />
          Save [F2]
        </button>

      </footer>


      {/* ================================================= */}
      {/* VOUCHER LOOKUP MODAL */}
      {/* ================================================= */}

      <VoucherLookupModal
        key={String(isLookupOpen)}
        open={isLookupOpen}
        pool={voucherPool}
        stagedSerials={stagedSerials}
        onClose={() =>
          setIsLookupOpen(false)
        }
        onSelect={handleLookupSelect}
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

export default VoucherTransfer;
