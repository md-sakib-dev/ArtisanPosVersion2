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

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getPendingChallans,
  getVoucherReceiveByReference,
  receiveChalan,
  type PendingChallan,
  type VoucherReceiveDetail,
} from "../../api/voucherReceiveApi";

// ======================================================
// TYPES
// ======================================================

interface VoucherRow extends VoucherReceiveDetail {
  id: number;
}

type Toast =
  | {
      message: string;
      type: "success" | "error";
    }
  | null;

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
  children: ReactNode;
}

function Field({
  label,
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
        {label}
      </label>

      {children}
    </div>
  );
}

// ======================================================
// GIFT VOUCHER RECEIVE
// ======================================================

function GiftVoucherReceive() {
  // ====================================================
  // FORM STATE
  // ====================================================

  const [receivedFrom, setReceivedFrom] =
    useState("");

  const [referenceNumber, setReferenceNumber] =
    useState("");

  // ====================================================
  // VOUCHER LIST STATE
  // ====================================================

  const [rows, setRows] =
    useState<VoucherRow[]>([]);

  const [loadedReferenceNumber, setLoadedReferenceNumber] =
    useState<string | null>(null);

  // ====================================================
  // API STATE
  // ====================================================

  const [pendingChallans, setPendingChallans] =
    useState<PendingChallan[]>([]);

  const [senderRemarks, setSenderRemarks] =
    useState("");

  const [receiverRemarks, setReceiverRemarks] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // ====================================================
  // UI STATE
  // ====================================================

  const [toast, setToast] =
    useState<Toast>(null);

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

  // ====================================================
  // LOAD PENDING CHALLANS
  // ====================================================

  const loadPendingChallans =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await getPendingChallans();

        if (!response.success) {
          showToast(
            response.message ||
              "Failed to load pending challans",
            "error"
          );

          return;
        }

        setPendingChallans(
          response.data ?? []
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
      } finally {
        setLoading(false);
      }
    }, [showToast]);

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    loadPendingChallans();
  }, [loadPendingChallans]);

  // ====================================================
  // LOAD REFERENCE DETAILS
  // ====================================================

  const handleLoad = async () => {
    const reference =
      referenceNumber.trim();

    if (!reference) {
      showToast(
        "Reference No is required",
        "error"
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await getVoucherReceiveByReference(
          reference
        );

      if (!response.success) {
        setRows([]);

        showToast(
          response.message ||
            "Failed to load voucher details",
          "error"
        );

        return;
      }

      const voucherRows: VoucherRow[] =
        response.data.map(
          (voucher, index) => ({
            id: index + 1,
            voucherSerial:
              voucher.voucherSerial,
            voucherAmount:
              voucher.voucherAmount,
            voucherStatus:
              voucher.voucherStatus,
          })
        );

      setRows(voucherRows);

      setLoadedReferenceNumber(
        reference
      );

      showToast(
        `Reference ${reference} loaded — ${voucherRows.length} vouchers`,
        "success"
      );
    } catch (error) {
      console.error(
        "Failed to load voucher details:",
        error
      );

      setRows([]);

      showToast(
        "Failed to load voucher details",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // SELECT PENDING CHALLAN
  // ====================================================

  const handlePickPendingChallan = (
    challan: PendingChallan
  ) => {
    setReferenceNumber(
      challan.referenceNumber
    );

    setReceivedFrom(
      challan.productInTypeName
    );

    setSenderRemarks(
      challan.senderRemarks ?? ""
    );

    setPendingChallanOpen(false);

    showToast(
      `Reference ${challan.referenceNumber} selected — press Load`,
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
  // RECEIVE CHALLAN
  // ====================================================

  const handleReceive = async () => {
    if (!loadedReferenceNumber) {
      showToast(
        "Please load a reference first",
        "error"
      );

      return;
    }

    if (rows.length === 0) {
      showToast(
        "No vouchers available to receive",
        "error"
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await receiveChalan({
          referenceNumber:
            loadedReferenceNumber,

          receiverRemarks:
            receiverRemarks.trim(),
        });

      if (!response.success) {
        showToast(
          response.message ||
            "Voucher receive failed",
          "error"
        );

        return;
      }

      showToast(
        response.message ||
          "Voucher received successfully",
        "success"
      );

      // Clear form
      setRows([]);

      setReferenceNumber("");

      setLoadedReferenceNumber(
        null
      );

      setReceivedFrom("");

      setSenderRemarks("");

      setReceiverRemarks("");

      // Refresh pending challans
      await loadPendingChallans();
    } catch (error) {
      console.error(
        "Failed to receive voucher challan:",
        error
      );

      showToast(
        "Failed to receive voucher challan",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // CALCULATIONS
  // ====================================================

  const totalValue = rows.reduce(
    (total, row) =>
      total + row.voucherAmount,
    0
  );

  // ====================================================
  // UI
  // ====================================================

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
      {/* ================================================= */}
      {/* HEADER BAR */}
      {/* ================================================= */}

      <header
        className="
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
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-md
              bg-white/10
            "
          >
            <Gift size={16} />
          </div>

          <div>
            <h1
              className="
                text-sm
                font-semibold
                leading-none
              "
            >
              Gift Voucher Receive
            </h1>

            <p
              className="
                mt-0.5
                text-[9px]
                text-white/60
              "
            >
              Receive gift vouchers from
              branches &amp; partners
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
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
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          <Inbox size={14} />
          Pending Challan
        </button>
      </header>

      {/* ================================================= */}
      {/* REFERENCE DETAILS CARD */}
      {/* ================================================= */}

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
            items-end
            gap-2
            md:grid-cols-[1fr_1fr_auto_auto]
          "
        >
          {/* Receive From */}

          <Field label="Receive From">
            <input
              type="text"
              value={receivedFrom}
              readOnly
              className={`
                ${smallInputClass}
                bg-[#F5F7F3]
              `}
              placeholder="Receive From"
            />
          </Field>

          {/* Reference Number */}

          <Field label="Reference No">
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) =>
                setReferenceNumber(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLoad();
                }
              }}
              className={smallInputClass}
              placeholder="Reference No"
            />
          </Field>

          {/* Load */}

          <button
            type="button"
            disabled={loading}
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
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <ScanSearch size={14} />

            {loading
              ? "Loading..."
              : "Load"}
          </button>

          {/* Pending Challan */}

          <button
            type="button"
            disabled={loading}
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
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <Inbox size={14} />
            Pending Challan
          </button>
        </div>
      </section>

      {/* ================================================= */}
      {/* REMARKS */}
      {/* ================================================= */}

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
       
       
      </section>

      {/* ================================================= */}
      {/* VOUCHER LIST TABLE CARD */}
      {/* ================================================= */}

      <section
        className="
          flex
          min-h-0
          min-w-0
          flex-1
          flex-col
          overflow-hidden
          border-b
          border-[#DDE5DF]
          bg-white
        "
      >
        {/* TABLE HEADER STRIP */}

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
            <Gift
              size={14}
              className="text-[#10673E]"
            />

            <span
              className="
                text-xs
                font-semibold
                text-[#10673E]
              "
            >
              Voucher List
            </span>

            <span
              className="
                rounded-full
                bg-[#E8F5ED]
                px-2
                py-0.5
                text-[9px]
                font-semibold
                text-[#66736B]
              "
            >
              {rows.length}
            </span>

            {loadedReferenceNumber && (
              <span
                className="
                  rounded-full
                  bg-[#2D5597]/10
                  px-2
                  py-0.5
                  text-[9px]
                  font-semibold
                  text-[#2D5597]
                "
              >
                Reference{" "}
                {loadedReferenceNumber}
              </span>
            )}
          </div>

          <span
            className="
              text-[10px]
              text-[#66736B]
            "
          >
            {totalValue.toFixed(2)} BDT total
          </span>
        </div>

        {/* TABLE SCROLL AREA */}

        <div
          className="
            min-h-0
            flex-1
            overflow-auto
          "
        >
          <table
            className="
              w-full
              min-w-[720px]
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
                {/* Sl No */}

                <th
                  className="
                    px-3
                    py-2.5
                    text-center
                    text-[10px]
                    font-semibold
                  "
                >
                  Sl No
                </th>

                {/* Voucher Serial */}

                <th
                  className="
                    px-3
                    py-2.5
                    text-left
                    text-[10px]
                    font-semibold
                  "
                >
                  Voucher Serial
                </th>

                {/* Voucher Amount */}

                <th
                  className="
                    px-3
                    py-2.5
                    text-right
                    text-[10px]
                    font-semibold
                  "
                >
                  Voucher Amount
                </th>

                {/* Status */}

                <th
                  className="
                    px-3
                    py-2.5
                    text-center
                    text-[10px]
                    font-semibold
                  "
                >
                  Status
                </th>

                {/* Action */}

                <th
                  className="
                    px-3
                    py-2.5
                    text-center
                    text-[10px]
                    font-semibold
                  "
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-14 text-center"
                  >
                    <div
                      className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        text-[#9AA29C]
                      "
                    >
                      <ClipboardList
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
                        Enter a Reference No and
                        press Load, or pick one
                        from Pending Challan
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map(
                  (row, index) => (
                    <tr
                      key={row.id}
                      className="
                        border-b
                        border-[#ECEFEA]
                        transition-colors
                        hover:bg-[#F1F8F3]
                      "
                    >
                      {/* Sl No */}

                      <td
                        className="
                          px-3
                          py-2
                          text-center
                          tabular-nums
                          text-[#8A938B]
                        "
                      >
                        {index + 1}
                      </td>

                      {/* Voucher Serial */}

                      <td
                        className="
                          px-3
                          py-2
                          font-mono
                          text-[11px]
                          font-medium
                          text-[#17231D]
                        "
                      >
                        {row.voucherSerial}
                      </td>

                      {/* Voucher Amount */}

                      <td
                        className="
                          px-3
                          py-2
                          text-right
                          font-semibold
                          tabular-nums
                          text-[#10673E]
                        "
                      >
                        {row.voucherAmount.toFixed(
                          2
                        )}
                      </td>

                      {/* Status */}

                      <td
                        className="
                          px-3
                          py-2
                          text-center
                        "
                      >
                        <span
                          className={`
                            inline-flex
                            items-center
                            rounded-full
                            px-2
                            py-0.5
                            text-[9px]
                            font-semibold
                            ${
                              row.voucherStatus
                                ? "bg-[#E8F5ED] text-[#0E9351]"
                                : "bg-[#FCECEC] text-[#B84A4A]"
                            }
                          `}
                        >
                          {row.voucherStatus
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* Action */}

                      <td
                        className="
                          px-3
                          py-2
                          text-center
                        "
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleRemove(
                              row.id
                            )
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
                          <Trash2
                            size={14}
                          />
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* ================================================= */}
        {/* RECEIVE FOOTER */}
        {/* ================================================= */}

        <div
  className="
    flex
    shrink-0
    items-end
    gap-3
    border-t
    border-[#DDE5DF]
    bg-white
    px-[clamp(8px,1vw,16px)]
    py-2.5
  "
>
  {/* Sender Remarks */}

  <div className="min-w-0 flex-1">
    <Field label="Sender Remarks">
      <input
        type="text"
        value={senderRemarks}
        readOnly
        className={`
          ${smallInputClass}
          bg-[#F5F7F3]
          cursor-not-allowed
        `}
        placeholder="Sender remarks"
      />
    </Field>
  </div>

  {/* Receiver Remarks */}

  <div className="min-w-0 flex-1">
    <Field label="Receiver Remarks">
      <input
        type="text"
        value={receiverRemarks}
        onChange={(e) =>
          setReceiverRemarks(e.target.value)
        }
        className={smallInputClass}
        placeholder="Enter receiver remarks"
      />
    </Field>
  </div>

  {/* Receive Button */}

  <div className="shrink-0">
    <button
      type="button"
      disabled={
        loading ||
        !loadedReferenceNumber ||
        rows.length === 0
      }
      onClick={handleReceive}
      className="
        inline-flex
        h-9
        items-center
        justify-center
        gap-1.5
        rounded-md
        bg-[#0E9351]
        px-5
        text-xs
        font-semibold
        text-white
        shadow-sm
        transition
        hover:bg-[#10673E]
        active:scale-[0.98]
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      <CheckCircle2 size={14} />

      {loading
        ? "Processing..."
        : "Receive"}
    </button>
  </div>
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
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* Modal Header */}

            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-[#DDE5DF]
                px-5
                py-3.5
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <div
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-md
                    bg-[#10673E]/10
                    text-[#10673E]
                  "
                >
                  <Inbox size={15} />
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
                      text-[10px]
                      text-[#9AA29C]
                    "
                  >
                    Select a challan to fill
                    the form
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPendingChallanOpen(
                    false
                  )
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

            <div
              className="
                max-h-80
                overflow-y-auto
              "
            >
              {pendingChallans.length ===
              0 ? (
                <div
                  className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    py-12
                    text-[#9AA29C]
                  "
                >
                  <Inbox
                    size={28}
                    strokeWidth={1.5}
                  />

                  <p
                    className="
                      mt-2
                      text-xs
                      font-medium
                    "
                  >
                    No pending challans
                  </p>
                </div>
              ) : (
                <ul
                  className="
                    divide-y
                    divide-[#ECEFEA]
                  "
                >
                  {pendingChallans.map(
                    (challan) => (
                      <li
                        key={
                          challan.referenceNumber
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handlePickPendingChallan(
                              challan
                            )
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
                          <div
                            className="
                              min-w-0
                            "
                          >
                            <div
                              className="
                                font-mono
                                text-xs
                                font-semibold
                                text-[#17231D]
                              "
                            >
                              {
                                challan.referenceNumber
                              }
                            </div>

                            <div
                              className="
                                mt-1
                                text-[10px]
                                text-[#66736B]
                              "
                            >
                              {
                                challan.productInTypeName
                              }
                            </div>
                          </div>

                          <div
                            className="
                              flex
                              shrink-0
                              items-center
                              gap-3
                              text-[10px]
                              text-[#66736B]
                            "
                          >
                            <span>
                              {formatDate(
                                challan.inDate
                              )}
                            </span>

                            <span
                              className="
                                rounded-full
                                bg-[#E8F5ED]
                                px-2
                                py-0.5
                                font-semibold
                                text-[#0E9351]
                              "
                            >
                              Pending
                            </span>
                          </div>
                        </button>
                      </li>
                    )
                  )}
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

export default GiftVoucherReceive;