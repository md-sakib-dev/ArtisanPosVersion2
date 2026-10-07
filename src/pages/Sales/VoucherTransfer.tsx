import {
  ArrowLeftRight,
  ClipboardList,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Warehouse,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getBranchDropdown } from "../../api/branchApi";
import { useAuth } from "../../contexts/AuthContext";

import {
  getVoucherTransfers,
  createVoucherTransfer,
  type VoucherTransferApiItem,
} from "../../api/voucherTransferApi";

// ======================================================
// TYPES
// ======================================================

interface VoucherInfo {
  referenceNumber: string;
  serial: string;
  value: number;
}

interface StagedVoucher extends VoucherInfo {
  id: number;
}

interface BranchOption {
  value: number;
  text: string;
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


// ======================================================
// VOUCHER LOOKUP MODAL
// ======================================================

interface VoucherLookupModalProps {
  open: boolean;
  vouchers: VoucherInfo[];
  stagedSerials: string[];
  loading: boolean;
  onClose: () => void;
  onSelect: (voucher: VoucherInfo) => void;
}

function VoucherLookupModal({
  open,
  vouchers,
  stagedSerials,
  loading,
  onClose,
  onSelect,
}: VoucherLookupModalProps) {

  const [searchText, setSearchText] =
    useState("");

  useEffect(() => {
    if (open) {
      setSearchText("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const filteredVouchers = vouchers.filter(
    (voucher) => {

      const search =
        searchText.trim().toLowerCase();

      if (!search) {
        return true;
      }

      return (
        voucher.referenceNumber
          .toLowerCase()
          .includes(search) ||
        voucher.serial
          .toLowerCase()
          .includes(search)
      );
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
          max-w-4xl
          flex-col
          overflow-hidden
          rounded-xl
          border
          border-[#DDE5DF]
          bg-white
          shadow-2xl
        "
      >

        {/* =================================================
            MODAL HEADER
        ================================================= */}

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
                Available Vouchers
              </h2>

              <p
                className="
                  text-[9px]
                  text-[#66736B]
                "
              >
                Select vouchers for transfer
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
              hover:bg-white
              hover:text-[#10673E]
            "
          >
            <X size={18} />
          </button>

        </div>


        {/* =================================================
            SEARCH
        ================================================= */}

        <div
          className="
            shrink-0
            border-b
            border-[#ECEFEA]
            bg-white
            px-4
            py-2.5
          "
        >

          <div className="max-w-md">

            <div className="relative">

              <Search
                size={14}
                className="
                  absolute
                  left-2.5
                  top-1/2
                  -translate-y-1/2
                  text-[#9AA29C]
                "
              />

              <input
                type="text"
                value={searchText}
                onChange={(e) =>
                  setSearchText(
                    e.target.value
                  )
                }
                placeholder="
                  Search reference number or voucher serial
                "
                className={`
                  ${smallInputClass}
                  pl-8
                `}
                autoFocus
              />

            </div>

          </div>

        </div>


        {/* =================================================
            TABLE
        ================================================= */}

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
              min-w-[650px]
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
                    text-center
                    text-[10px]
                    font-semibold
                  "
                >
                  Sl No
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
                  Reference Number
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
                  Voucher Serial
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
                  Voucher Amount
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
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={5}
                    className="
                      px-3
                      py-12
                      text-center
                    "
                  >

                    <div
                      className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        text-[#66736B]
                      "
                    >

                      <Loader2
                        size={25}
                        className="animate-spin"
                      />

                      <p
                        className="
                          mt-2
                          text-xs
                        "
                      >
                        Loading vouchers...
                      </p>

                    </div>

                  </td>

                </tr>

              ) : filteredVouchers.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="
                      px-3
                      py-12
                      text-center
                      text-xs
                      text-[#9AA29C]
                    "
                  >
                    No vouchers found.
                  </td>

                </tr>

              ) : (

                filteredVouchers.map(
                  (voucher, index) => {

                    const alreadyStaged =
                      stagedSerials.some(
                        (serial) =>
                          serial.toLowerCase() ===
                          voucher.serial.toLowerCase()
                      );

                    return (

                      <tr
                        key={`${voucher.referenceNumber}-${voucher.serial}`}
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
                            py-2.5
                            text-center
                            tabular-nums
                            text-[#8A938B]
                          "
                        >
                          {index + 1}
                        </td>

                        <td
                          className="
                            px-3
                            py-2.5
                            font-medium
                            text-[#17231D]
                          "
                        >
                          {voucher.referenceNumber}
                        </td>

                        <td
                          className="
                            px-3
                            py-2.5
                            font-mono
                            text-[11px]
                            text-[#66736B]
                          "
                        >
                          {voucher.serial}
                        </td>

                        <td
                          className="
                            px-3
                            py-2.5
                            text-right
                            font-semibold
                            tabular-nums
                            text-[#10673E]
                          "
                        >
                          {voucher.value.toFixed(2)}
                        </td>

                        <td
                          className="
                            px-3
                            py-2.5
                            text-center
                          "
                        >

                          <button
                            type="button"
                            disabled={
                              alreadyStaged
                            }
                            onClick={() =>
                              onSelect(
                                voucher
                              )
                            }
                            className={`
                              inline-flex
                              h-7
                              items-center
                              justify-center
                              gap-1
                              rounded-md
                              px-3
                              text-[10px]
                              font-semibold
                              transition

                              ${
                                alreadyStaged
                                  ? `
                                    cursor-not-allowed
                                    bg-[#F3F4F2]
                                    text-[#9AA29C]
                                  `
                                  : `
                                    bg-[#0E9351]
                                    text-white
                                    hover:bg-[#10673E]
                                  `
                              }
                            `}
                          >

                            {alreadyStaged ? (
                              "Added"
                            ) : (
                              <>
                                <Plus size={13} />
                                Select
                              </>
                            )}

                          </button>

                        </td>

                      </tr>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>


        {/* =================================================
            MODAL FOOTER
        ================================================= */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            border-t
            border-[#E6EAE3]
            bg-[#FAFBF9]
            px-4
            py-2.5
          "
        >

          <span
            className="
              text-[10px]
              text-[#66736B]
            "
          >
            {filteredVouchers.length} voucher(s)
            found
          </span>

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
// MAIN VOUCHER TRANSFER
// ======================================================

function VoucherTransfer() {

  // ====================================================
  // AUTH
  // Same pattern as your StockTransfer page
  // ====================================================

  const { user } = useAuth();

  const myBranchId =
    user?.branchId ?? 0;


  // ====================================================
  // BRANCH DROPDOWN
  // ====================================================

  const [branchOptions, setBranchOptions] =
    useState<BranchOption[]>([]);

  const [branchesLoading, setBranchesLoading] =
    useState(true);


  useEffect(() => {

    let cancelled = false;

    const loadBranches = async () => {

      setBranchesLoading(true);

      try {

        const response =
          await getBranchDropdown();

        if (cancelled) {
          return;
        }

        /*
          Same logic as StockTransfer:
          don't show the logged-in user's own branch.
        */

        setBranchOptions(
          (response.data ?? []).filter(
            (option) =>
              option.value !== myBranchId
          )
        );

      } catch (error) {

        console.error(
          "Failed to load branch dropdown:",
          error
        );

        if (!cancelled) {
          setBranchOptions([]);
        }

      } finally {

        if (!cancelled) {
          setBranchesLoading(false);
        }

      }

    };

    loadBranches();

    return () => {
      cancelled = true;
    };

  }, [myBranchId]);


  // ====================================================
  // TRANSFER TO
  // ====================================================

  const [transferTo, setTransferTo] =
    useState("");


  // ====================================================
  // VOUCHER SEARCH
  // ====================================================

  const [voucherPool, setVoucherPool] =
    useState<VoucherInfo[]>([]);

  const [vouchersLoading, setVouchersLoading] =
    useState(false);

  const [serialInput, setSerialInput] =
    useState("");

  const serialRef =
    useRef<HTMLInputElement>(null);


  // ====================================================
  // STAGED VOUCHERS
  // ====================================================

  const [rows, setRows] =
    useState<StagedVoucher[]>([]);

  const [nextId, setNextId] =
    useState(1);


  // ====================================================
  // REMARKS
  // ====================================================

  const [remarks, setRemarks] =
    useState("");


  // ====================================================
  // UI
  // ====================================================

  const [isLookupOpen, setIsLookupOpen] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [toast, setToast] =
    useState<Toast>(null);


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
  // GET VOUCHERS
  //
  // GET /api/VoucherTransfers
  // ====================================================

  const handleVoucherSearch =
    async () => {

      setIsLookupOpen(true);

      setVouchersLoading(true);

      try {

        const response =
          await getVoucherTransfers();

        if (!response.success) {

          setVoucherPool([]);

          showToast(
            response.message ||
              "Failed to retrieve vouchers",
            "error"
          );

          return;
        }

        const vouchers: VoucherInfo[] =
          (response.data ?? []).map(
            (
              item: VoucherTransferApiItem
            ) => ({
              referenceNumber:
                item.referenceNumber,

              serial:
                item.voucherSerial,

              value:
                Number(
                  item.voucherAmount
                ),
            })
          );

        setVoucherPool(vouchers);

        if (vouchers.length === 0) {

          showToast(
            "No available vouchers found",
            "error"
          );

        }

      } catch (error: any) {

        console.error(
          "Failed to load vouchers:",
          error
        );

        setVoucherPool([]);

        showToast(
          error?.response?.data?.message ||
            "Failed to load vouchers",
          "error"
        );

      } finally {

        setVouchersLoading(false);

      }

    };


  // ====================================================
  // STAGE VOUCHER
  // ====================================================

  const stageVoucher = (
    voucher: VoucherInfo
  ) => {

    const exists =
      rows.some(
        (row) =>
          row.serial.toLowerCase() ===
          voucher.serial.toLowerCase()
      );

    if (exists) {

      showToast(
        `Voucher ${voucher.serial} is already staged`,
        "error"
      );

      return;
    }

    /*
      Important:
      We use the real API voucher information.
      We do NOT create fake voucher data.
    */

    const newRow: StagedVoucher = {
      ...voucher,
      id: nextId,
    };

    setRows((previousRows) => [
      ...previousRows,
      newRow,
    ]);

    setNextId(
      (id) => id + 1
    );

    showToast(
      `Voucher ${voucher.serial} staged`,
      "success"
    );

  };


  // ====================================================
  // ADD BY SERIAL
  // ====================================================

  const handleAdd = () => {

    const serial =
      serialInput.trim();

    if (!serial) {

      showToast(
        "Enter voucher serial first",
        "error"
      );

      serialRef.current?.focus();

      return;
    }

    /*
      Search inside vouchers already retrieved
      from GET /api/VoucherTransfers.
    */

    const match =
      voucherPool.find(
        (voucher) =>
          voucher.serial.toLowerCase() ===
          serial.toLowerCase()
      );

    if (!match) {

      showToast(
        "Voucher not found. Click SEARCH first.",
        "error"
      );

      return;
    }

    stageVoucher(match);

    setSerialInput("");

    serialRef.current?.focus();

  };


  // ====================================================
  // SELECT FROM LOOKUP
  // ====================================================

  const handleLookupSelect = (
    voucher: VoucherInfo
  ) => {

    stageVoucher(voucher);

  };


  // ====================================================
  // REMOVE
  // ====================================================

  const handleRemove = (
    id: number
  ) => {

    setRows(
      (previousRows) =>
        previousRows.filter(
          (row) => row.id !== id
        )
    );

  };


  // ====================================================
  // TOTAL VALUE
  // ====================================================

  const totalValue = useMemo(
    () =>
      rows.reduce(
        (total, row) =>
          total +
          Number(row.value || 0),
        0
      ),
    [rows]
  );


  // ====================================================
  // STAGED SERIALS
  // ====================================================

  const stagedSerials = useMemo(
    () =>
      rows.map(
        (row) => row.serial
      ),
    [rows]
  );


  // ====================================================
  // SAVE
  //
  // POST /api/VoucherTransfers
  // ====================================================

  const handleSave =
    async () => {

      // -----------------------------------------------
      // Validate vouchers
      // -----------------------------------------------

      if (rows.length === 0) {

        showToast(
          "No vouchers staged for transfer",
          "error"
        );

        return;
      }


      // -----------------------------------------------
      // Validate destination
      // -----------------------------------------------

      if (!transferTo) {

        showToast(
          "Select a transfer destination first",
          "error"
        );

        return;
      }


      // -----------------------------------------------
      // Validate branch
      // -----------------------------------------------

      if (!myBranchId) {

        showToast(
          "Your user has no branch assigned",
          "error"
        );

        return;
      }


      // -----------------------------------------------
      // Validate reference numbers
      // -----------------------------------------------

      const referenceNumbers = [
        ...new Set(
          rows.map(
            (row) =>
              row.referenceNumber
          )
        ),
      ];

      /*
        POST structure contains:

        master.referenceNumber

        Therefore one transfer can contain
        only one reference number.
      */

      if (
        referenceNumbers.length !== 1
      ) {

        showToast(
          "Selected vouchers belong to different reference numbers",
          "error"
        );

        return;
      }


      // -----------------------------------------------
      // Build payload
      // -----------------------------------------------

      const payload = {

        master: {

          referenceNumber:
            referenceNumbers[0],

          outToBranchId:
            Number(transferTo),

        },

        details:
          rows.map((row) => ({
            voucherSerial:
              row.serial,
          })),

      };


      console.log(
        "Voucher Transfer Payload:",
        payload
      );


      // -----------------------------------------------
      // SAVE
      // -----------------------------------------------

      setIsSaving(true);

      try {

        const response =
          await createVoucherTransfer(
            payload
          );

        if (!response.success) {

          showToast(
            response.message ||
              "Failed to save voucher transfer",
            "error"
          );

          return;
        }


        // ---------------------------------------------
        // SUCCESS
        // ---------------------------------------------

        showToast(
          response.message ||
            `Transfer saved successfully — ${rows.length} vouchers`,
          "success"
        );


        // ---------------------------------------------
        // CLEAR FORM
        // ---------------------------------------------

        setRows([]);

        setNextId(1);

        setTransferTo("");

        setSerialInput("");

        setVoucherPool([]);

        setRemarks("");

      } catch (error: any) {

        console.error(
          "Save voucher transfer failed:",
          error
        );

        showToast(
          error?.response?.data?.message ||
            "Unable to reach the server",
          "error"
        );

      } finally {

        setIsSaving(false);

      }

    };


  // ====================================================
  // CLEAR
  // ====================================================

  const handleClear = () => {

    setRows([]);

    setNextId(1);

    setTransferTo("");

    setSerialInput("");

    setVoucherPool([]);

    setRemarks("");

    setIsLookupOpen(false);

    serialRef.current?.focus();

  };


  // ====================================================
  // F2 SAVE
  // ====================================================

  useEffect(() => {

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {

      if (event.key === "F2") {

        event.preventDefault();

        void handleSave();

      }

    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, [
    rows,
    transferTo,
    myBranchId,
  ]);


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

      <style>{`

        @keyframes vt-fade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes vt-pop {
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


      {/* =================================================
          PAGE HEADER
      ================================================= */}

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
              bg-[#10673E]
              text-white
            "
          >
            <ArrowLeftRight size={16} />
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
              Voucher Transfer
            </h1>

            <p
              className="
                mt-0.5
                text-[9px]
                text-[#66736B]
              "
            >
              Transfer vouchers between branches
            </p>

          </div>

        </div>


        <span
          className="
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
          "
        >

          <ArrowLeftRight size={11} />

          {rows.length} voucher
          {rows.length !== 1
            ? "s"
            : ""} staged

        </span>

      </header>


      {/* =================================================
          TRANSFER CONTROLS
      ================================================= */}

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
            md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]
          "
        >

          {/* ---------------------------------------------
              TRANSFER TO
          --------------------------------------------- */}

          <Field
            label="Transfer To"
            icon={
              <Warehouse size={13} />
            }
          >

            <select
              value={transferTo}
              onChange={(e) =>
                setTransferTo(
                  e.target.value
                )
              }
              disabled={
                branchesLoading ||
                branchOptions.length === 0
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

              <option
                value=""
                disabled
              >
                {branchesLoading
                  ? "Loading branches..."
                  : branchOptions.length === 0
                    ? "No other branches available"
                    : "Select destination"}
              </option>

              {branchOptions.map(
                (option) => (

                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.text}
                  </option>

                )
              )}

            </select>

          </Field>


          {/* ---------------------------------------------
              VOUCHER SERIAL
          --------------------------------------------- */}

          <Field
            label="Voucher Serial"
            icon={
              <ClipboardList size={13} />
            }
          >

            <div
              className="
                flex
                gap-2
              "
            >

              <input
                ref={serialRef}
                value={serialInput}
                onChange={(e) =>
                  setSerialInput(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {

                  if (
                    e.key === "Enter"
                  ) {

                    e.preventDefault();

                    handleAdd();

                  }

                }}
                className={`
                  ${smallInputClass}
                  font-mono
                `}
                placeholder="
                  Enter voucher serial
                "
              />


              <button
                type="button"
                onClick={handleAdd}
                className="
                  inline-flex
                  h-8
                  shrink-0
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
                "
              >

                <Plus size={13} />

                Add

              </button>

            </div>

          </Field>


          {/* ---------------------------------------------
              SEARCH
          --------------------------------------------- */}

          <div
            className="
              flex
              items-end
            "
          >

            <button
              type="button"
              onClick={() =>
                void handleVoucherSearch()
              }
              disabled={vouchersLoading}
              className="
                inline-flex
                h-8
                w-full
                items-center
                justify-center
                gap-1.5
                rounded-md
                border
                border-[#DDE5DF]
                bg-white
                px-5
                text-[10px]
                font-semibold
                text-[#10673E]
                transition
                hover:border-[#0E9351]
                hover:bg-[#F1F8F3]
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {vouchersLoading ? (

                <Loader2
                  size={13}
                  className="animate-spin"
                />

              ) : (

                <Search size={13} />

              )}

              SEARCH

            </button>

          </div>

        </div>

      </section>


      {/* =================================================
          VOUCHER TABLE
      ================================================= */}

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

            <ClipboardList
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
              Transfer Vouchers
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

          </div>


          <span
            className="
              text-[10px]
              text-[#66736B]
            "
          >
            Total:
            <b className="ml-1 text-[#10673E]">
              {totalValue.toFixed(2)}
            </b>
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

          <table
            className="
              w-full
              min-w-[700px]
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
                    text-center
                    text-[10px]
                    font-semibold
                  "
                >
                  Sl No
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
                  Reference Number
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
                  Voucher Serial
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
                  Voucher Amount
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
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {rows.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="
                      py-14
                      text-center
                    "
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
                        No vouchers staged
                      </p>

                      <p
                        className="
                          mt-1
                          text-[10px]
                        "
                      >
                        Click SEARCH to load
                        available vouchers
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

                      <td
                        className="
                          px-3
                          py-2.5
                          text-center
                          tabular-nums
                          text-[#8A938B]
                        "
                      >
                        {index + 1}
                      </td>


                      <td
                        className="
                          px-3
                          py-2.5
                          font-medium
                          text-[#17231D]
                        "
                      >
                        {row.referenceNumber}
                      </td>


                      <td
                        className="
                          px-3
                          py-2.5
                          font-mono
                          text-[11px]
                          text-[#66736B]
                        "
                      >
                        {row.serial}
                      </td>


                      <td
                        className="
                          px-3
                          py-2.5
                          text-right
                          font-semibold
                          tabular-nums
                          text-[#10673E]
                        "
                      >
                        {row.value.toFixed(2)}
                      </td>


                      <td
                        className="
                          px-3
                          py-2.5
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


            {/* TOTAL */}

            {rows.length > 0 && (

              <tfoot>

                <tr
                  className="
                    bg-[#F1F8F3]
                  "
                >

                  <td
                    colSpan={3}
                    className="
                      px-3
                      py-2.5
                      text-right
                      text-xs
                      font-bold
                      text-[#10673E]
                    "
                  >
                    Total Voucher Amount
                  </td>

                  <td
                    className="
                      px-3
                      py-2.5
                      text-right
                      text-xs
                      font-bold
                      tabular-nums
                      text-[#10673E]
                    "
                  >
                    {totalValue.toFixed(2)}
                  </td>

                  <td />

                </tr>

              </tfoot>

            )}

          </table>

        </div>

      </section>


      {/* =================================================
          BOTTOM SECTION
      ================================================= */}

      <footer
        className="
          flex
          shrink-0
          flex-wrap
          items-end
          justify-between
          gap-3
          bg-white
          px-[clamp(8px,1vw,16px)]
          py-2.5
        "
      >

        {/* REMARKS */}

        <div
          className="
            min-w-[250px]
            flex-1
          "
        >

          <label
            className="
              mb-1
              block
              text-[10px]
              font-semibold
              text-[#66736B]
            "
          >
            Remarks
          </label>

          <textarea
            value={remarks}
            onChange={(e) =>
              setRemarks(
                e.target.value
              )
            }
            rows={2}
            placeholder="Enter remarks..."
            className="
              h-12
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


        {/* ACTIONS */}

        <div
          className="
            flex
            shrink-0
            items-end
            gap-1.5
          "
        >

          <button
            type="button"
            onClick={handleClear}
            className={secondaryButtonClass}
          >

            <X size={14} />

            Clear

          </button>


          <button
            type="button"
            onClick={() =>
              void handleSave()
            }
            disabled={
              isSaving ||
              rows.length === 0 ||
              !transferTo
            }
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

            {isSaving ? (

              <Loader2
                size={14}
                className="animate-spin"
              />

            ) : (

              <Save size={14} />

            )}

            Save

            <span className="text-[9px] opacity-80">
              [F2]
            </span>

          </button>

        </div>

      </footer>


      {/* =================================================
          LOOKUP MODAL
      ================================================= */}

      <VoucherLookupModal
        open={isLookupOpen}
        vouchers={voucherPool}
        stagedSerials={stagedSerials}
        loading={vouchersLoading}
        onClose={() =>
          setIsLookupOpen(false)
        }
        onSelect={
          handleLookupSelect
        }
      />


      {/* =================================================
          TOAST
      ================================================= */}

      {toast && (

        <div
          className={`
            fixed
            bottom-8
            left-1/2
            z-[100]
            -translate-x-1/2
            rounded-md
            px-4
            py-2.5
            text-xs
            font-semibold
            text-white
            shadow-lg

            ${
              toast.type === "success"
                ? "bg-[#10673E]"
                : "bg-[#B84A4A]"
            }
          `}
        >
          {toast.message}
        </div>

      )}

    </div>

  );
}

export default VoucherTransfer;