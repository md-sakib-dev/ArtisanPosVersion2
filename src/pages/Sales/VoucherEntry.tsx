import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  Hash,
  Minus,
  Plus,
  Printer,
  Save,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";


// ======================================================
// TYPES
// ======================================================

interface VoucherItem {
  id: number;
  serial: string;
  expireDate: string;
  qty: number;
}

type DiscountType = "none" | "percent" | "fixed";
type PaymentMethod = "cash" | "card" | "mobile";


// ======================================================
// CONSTANTS & REUSABLE STYLES
// ======================================================

const VOUCHER_DEFAULT_PRICE = 1000;

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
  text-right
  text-xs
  font-medium
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
  border-[#D5DBD2]
  bg-white
  px-3
  text-xs
  font-medium
  text-[#354536]
  transition
  hover:border-[#596B4F]
  hover:bg-[#F3F6F0]
  active:scale-[0.98]
`;

const primaryButtonClass = `
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
  transition
  hover:bg-[#4E6048]
  active:scale-[0.98]
`;

const addButtonClass = `
  flex
  h-8
  items-center
  justify-center
  gap-1.5
  rounded-md
  bg-[#354536]
  px-4
  text-xs
  font-semibold
  text-white
  transition
  hover:bg-[#4E6048]
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
    <div>

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
// VOUCHER FORM
// ======================================================

interface VoucherFormProps {
  serial: string;
  expireDate: string;
  onSerialChange: (value: string) => void;
  onExpireDateChange: (value: string) => void;
  onAdd: () => void;
}

function VoucherForm({
  serial,
  expireDate,
  onSerialChange,
  onExpireDateChange,
  onAdd,
}: VoucherFormProps) {

  return (
    <div className="
      flex
      flex-wrap
      items-end
      gap-2
    ">

      <div className="min-w-[160px] flex-1">

        <Field
          label="Voucher Serial"
          icon={<Hash size={13} />}
        >

          <input
            id="voucher-serial-input"
            value={serial}
            onChange={(e) =>
              onSerialChange(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onAdd();
              }
            }}
            placeholder="Scan or type voucher serial"
            className={`
              ${smallInputClass}
              font-mono
            `}
          />

        </Field>

      </div>


      <div className="w-40">

        <Field
          label="Expire Date"
          icon={<CalendarDays size={13} />}
        >

          <input
            type="date"
            value={expireDate}
            onChange={(e) =>
              onExpireDateChange(e.target.value)
            }
            className={smallInputClass}
          />

        </Field>

      </div>


      <button
        type="button"
        onClick={onAdd}
        className={addButtonClass}
      >
        <Plus size={15} />
        Add
      </button>

    </div>
  );
}


// ======================================================
// VOUCHER TABLE
// ======================================================

interface VoucherTableProps {
  items: VoucherItem[];
  onQtyStep: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
}

function VoucherTable({
  items,
  onQtyStep,
  onRemove,
}: VoucherTableProps) {

  return (
    <div className="
      flex
      min-h-0
      min-w-0
      flex-1
      flex-col
      overflow-hidden
    ">

      <div className="
        min-h-0
        flex-1
        overflow-auto
      ">

        <table className="
          w-full
          min-w-[640px]
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
                px-2
                py-2
                text-center
                text-[10px]
                font-semibold
              ">
                SL
              </th>

              <th className="
                px-3
                py-2
                text-left
                text-[10px]
                font-semibold
              ">
                Voucher Serial
              </th>

              <th className="
                px-3
                py-2
                text-left
                text-[10px]
                font-semibold
              ">
                Expire Date
              </th>

              <th className="
                px-3
                py-2
                text-center
                text-[10px]
                font-semibold
              ">
                Qty
              </th>

              <th className="
                px-3
                py-2
                text-right
                text-[10px]
                font-semibold
              ">
                Total
              </th>

              <th className="
                px-2
                py-2
                text-center
                text-[10px]
                font-semibold
              ">
                Action
              </th>

            </tr>

          </thead>


          <tbody>

            {items.length === 0 ? (

              <tr>

                <td
                  colSpan={6}
                  className="py-10 text-center"
                >

                  <div className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    text-[#9AA29C]
                  ">

                    <ShoppingCart
                      size={30}
                      strokeWidth={1.5}
                    />

                    <p className="
                      mt-2
                      text-xs
                      font-medium
                    ">
                      No vouchers added
                    </p>

                    <p className="mt-1 text-[10px]">
                      Enter a voucher serial above
                      and press Add
                    </p>

                  </div>

                </td>

              </tr>

            ) : (

              items.map((item, index) => (

                <tr
                  key={item.id}
                  className="
                    border-b
                    border-[#ECEFEA]
                    transition-colors
                    hover:bg-[#F6F8F4]
                  "
                >

                  <td className="
                    px-2
                    py-1.5
                    text-center
                    tabular-nums
                    text-[#8A938B]
                  ">
                    {index + 1}
                  </td>

                  <td className="px-3 py-1.5">

                    <span className="
                      font-mono
                      text-[11px]
                      font-medium
                      text-[#263027]
                    ">
                      {item.serial}
                    </span>

                  </td>

                  <td className="
                    px-3
                    py-1.5
                    text-[#687269]
                  ">
                    {formatDate(item.expireDate)}
                  </td>

                  <td className="px-3 py-1.5">

                    <div className="
                      flex
                      items-center
                      justify-center
                      gap-1
                    ">

                      <button
                        type="button"
                        disabled={item.qty <= 1}
                        onClick={() =>
                          onQtyStep(item.id, -1)
                        }
                        className="
                          flex
                          h-6
                          w-6
                          items-center
                          justify-center
                          rounded-md
                          border
                          border-[#D5DBD2]
                          bg-white
                          text-[#354536]
                          transition
                          hover:bg-[#F3F6F0]
                          disabled:cursor-not-allowed
                          disabled:opacity-40
                        "
                      >
                        <Minus size={12} />
                      </button>

                      <span className="
                        w-8
                        text-center
                        text-xs
                        font-semibold
                        tabular-nums
                        text-[#263027]
                      ">
                        {item.qty}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          onQtyStep(item.id, 1)
                        }
                        className="
                          flex
                          h-6
                          w-6
                          items-center
                          justify-center
                          rounded-md
                          border
                          border-[#D5DBD2]
                          bg-white
                          text-[#354536]
                          transition
                          hover:bg-[#F3F6F0]
                        "
                      >
                        <Plus size={12} />
                      </button>

                    </div>

                  </td>

                  <td className="
                    px-3
                    py-1.5
                    text-right
                    text-xs
                    font-semibold
                    tabular-nums
                    text-[#263027]
                  ">
                    {(
                      item.qty * VOUCHER_DEFAULT_PRICE
                    ).toFixed(2)}
                  </td>

                  <td className="px-2 py-1.5 text-center">

                    <button
                      type="button"
                      onClick={() =>
                        onRemove(item.id)
                      }
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

    </div>
  );
}


// ======================================================
// SIDEBAR FIELD
// ======================================================

function SidebarField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {

  return (
    <div>

      <label className="
        mb-1
        block
        text-[10px]
        font-semibold
        text-[#687269]
      ">
        {label}
      </label>

      {children}

    </div>
  );
}


// ======================================================
// COMPACT FIELD
// ======================================================

function CompactField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {

  return (
    <div className="
      grid
      grid-cols-[95px_1fr]
      items-center
      gap-2
    ">

      <span className="
        text-[10px]
        font-medium
        text-[#687269]
      ">
        {label}
      </span>

      {children}

    </div>
  );
}


// ======================================================
// PAYMENT METHOD TOGGLE
// ======================================================

function MethodToggle({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        h-9
        items-center
        justify-center
        gap-1
        rounded-md
        border
        px-1
        text-[10px]
        font-medium
        transition
        active:scale-[0.98]
        ${
          active
            ? "border-[#354536] bg-[#354536] text-white"
            : "border-[#D5DBD2] bg-[#F8FAF6] text-[#354536] hover:border-[#596B4F] hover:bg-[#E8EDE3]"
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}


// ======================================================
// CHECKOUT SUMMARY (RIGHT PANEL)
// ======================================================

interface CheckoutSummaryProps {
  totalDue: number;
  discountType: DiscountType;
  discountAmount: string;
  totalReceived: string;
  refund: number;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  cashReceived: string;
  onDiscountTypeChange: (value: DiscountType) => void;
  onDiscountAmountChange: (value: string) => void;
  onTotalReceivedChange: (value: string) => void;
  onCustomerPhoneChange: (value: string) => void;
  onMethodChange: (method: PaymentMethod) => void;
  onCashReceivedChange: (value: string) => void;
}

function CheckoutSummary({
  totalDue,
  discountType,
  discountAmount,
  totalReceived,
  refund,
  customerPhone,
  paymentMethod,
  cashReceived,
  onDiscountTypeChange,
  onDiscountAmountChange,
  onTotalReceivedChange,
  onCustomerPhoneChange,
  onMethodChange,
  onCashReceivedChange,
}: CheckoutSummaryProps) {

  return (
    <aside className="
      flex
      min-h-0
      min-w-0
      flex-col
      overflow-hidden
      border
      border-[#D9DED5]
      bg-white
    ">

      <div className="
        min-h-0
        flex-1
        overflow-y-auto
        p-[clamp(6px,0.8vw,12px)]
      ">


        {/* TOTAL PAYABLE */}

        <div className="
          rounded-md
          bg-[#354536]
          px-3
          py-2.5
          text-white
        ">

          <div className="
            flex
            items-center
            justify-between
            text-[10px]
            font-medium
            text-white/60
          ">

            <span>
              TOTAL PAYABLE
            </span>

            <span>
              BDT
            </span>

          </div>

          <div className="
            mt-0.5
            text-right
            text-3xl
            font-bold
            leading-tight
            tracking-tight
            tabular-nums
          ">
            {totalDue.toFixed(2)}
          </div>

        </div>


        {/* SUMMARY FIELDS */}

        <div className="
          mt-2
          space-y-1.5
        ">

          <SidebarField label="Discount Type">

            <select
              value={discountType}
              onChange={(e) =>
                onDiscountTypeChange(
                  e.target.value as DiscountType
                )
              }
              className={smallInputClass}
            >
              <option value="none">
                No Discount
              </option>

              <option value="percent">
                Percentage (%)
              </option>

              <option value="fixed">
                Fixed Amount
              </option>

            </select>

          </SidebarField>


          <SidebarField label="Discount Amount">

            <input
              type="number"
              min={0}
              value={discountAmount}
              disabled={discountType === "none"}
              onChange={(e) =>
                onDiscountAmountChange(
                  e.target.value
                )
              }
              placeholder="0.00"
              className={`
                ${smallInputClass}
                disabled:cursor-not-allowed
                disabled:bg-[#F3F4F2]
                disabled:text-[#9AA29C]
              `}
            />

          </SidebarField>


          <SidebarField label="Total Due">

            <input
              readOnly
              value={totalDue.toFixed(2)}
              className={`
                ${readOnlyInputClass}
                text-[#354536]
              `}
            />

          </SidebarField>


          <SidebarField label="Total Received">

            <input
              type="number"
              min={0}
              value={totalReceived}
              onChange={(e) =>
                onTotalReceivedChange(
                  e.target.value
                )
              }
              placeholder="0.00"
              className={smallInputClass}
            />

          </SidebarField>


          <SidebarField label="Refund">

            <input
              readOnly
              value={refund.toFixed(2)}
              className={`
                ${readOnlyInputClass}
                font-semibold
                text-[#B84A4A]
              `}
            />

          </SidebarField>


          <SidebarField label="Customer Phone">

            <input
              type="tel"
              value={customerPhone}
              onChange={(e) =>
                onCustomerPhoneChange(
                  e.target.value
                )
              }
              placeholder="01XXXXXXXXX"
              className={smallInputClass}
            />

          </SidebarField>

        </div>


        {/* PAYMENT METHOD */}

        <div className="mt-2">

          <p className="
            mb-2
            text-[10px]
            font-semibold
            uppercase
            tracking-wide
            text-[#8A938B]
          ">
            Payment Method
          </p>

          <div className="
            grid
            grid-cols-3
            gap-1.5
          ">

            <MethodToggle
              icon={<Banknote size={13} />}
              label="Cash"
              active={paymentMethod === "cash"}
              onClick={() =>
                onMethodChange("cash")
              }
            />

            <MethodToggle
              icon={<CreditCard size={13} />}
              label="Card"
              active={paymentMethod === "card"}
              onClick={() =>
                onMethodChange("card")
              }
            />

            <MethodToggle
              icon={<Smartphone size={13} />}
              label="Mobile"
              active={paymentMethod === "mobile"}
              onClick={() =>
                onMethodChange("mobile")
              }
            />

          </div>

        </div>


        {/* CONDITIONAL CASH RECEIVED */}

        {paymentMethod === "cash" && (

          <div className="mt-2">

            <CompactField label="Cash Received">

              <input
                type="number"
                min={0}
                value={cashReceived}
                onChange={(e) =>
                  onCashReceivedChange(
                    e.target.value
                  )
                }
                placeholder="0.00"
                className="
                  h-9
                  w-full
                  rounded-md
                  border
                  border-[#B8C4B4]
                  bg-[#F8FAF6]
                  px-2.5
                  text-right
                  text-sm
                  font-semibold
                  tabular-nums
                  text-[#354536]
                  outline-none
                  focus:border-[#596B4F]
                  focus:ring-2
                  focus:ring-[#596B4F]/10
                "
              />

            </CompactField>

          </div>

        )}

      </div>

    </aside>
  );
}


// ======================================================
// ACTION BUTTON
// ======================================================

interface ActionButtonProps {
  icon: ReactNode;
  text: string;
  primary?: boolean;
  onClick: () => void;
}

function ActionButton({
  icon,
  text,
  primary = false,
  onClick,
}: ActionButtonProps) {

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? primaryButtonClass
          : secondaryButtonClass
      }
    >
      {icon}
      {text}
    </button>
  );
}


// ======================================================
// VOUCHER ENTRY (MAIN)
// ======================================================

function VoucherEntry() {

  // ====================================================
  // VOUCHER FORM STATE
  // ====================================================

  const [serialInput, setSerialInput] =
    useState("");

  const [expireDateInput, setExpireDateInput] =
    useState("");

  const [nextId, setNextId] = useState(1);


  // ====================================================
  // ITEMS STATE
  // ====================================================

  const [items, setItems] =
    useState<VoucherItem[]>([]);


  // ====================================================
  // CHECKOUT STATE
  // ====================================================

  const [discountType, setDiscountType] =
    useState<DiscountType>("none");

  const [discountAmount, setDiscountAmount] =
    useState("");

  const [totalReceived, setTotalReceived] =
    useState("");

  const [customerPhone, setCustomerPhone] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

  const [cashReceived, setCashReceived] =
    useState("");


  // ====================================================
  // UI STATE
  // ====================================================

  const [toast, setToast] =
    useState<{
      message: string;
      type: "success" | "error";
    } | null>(null);


  // ====================================================
  // ADD VOUCHER
  // ====================================================

  const handleAddVoucher = () => {

    const serial = serialInput.trim();

    if (!serial) {
      showToast(
        "Enter a voucher serial first",
        "error"
      );
      return;
    }

    setItems((previousItems) => [
      ...previousItems,
      {
        id: nextId,
        serial,
        expireDate: expireDateInput,
        qty: 1,
      },
    ]);

    setNextId((id) => id + 1);
    setSerialInput("");
    setExpireDateInput("");
  };


  // ====================================================
  // ITEM MUTATIONS
  // ====================================================

  const handleQtyStep = (
    id: number,
    delta: number
  ) => {

    setItems((previousItems) =>
      previousItems.map((item) =>
        item.id === id
          ? {
              ...item,
              qty: Math.max(
                1,
                item.qty + delta
              ),
            }
          : item
      )
    );
  };

  const handleRemove = (id: number) => {

    setItems((previousItems) =>
      previousItems.filter(
        (item) => item.id !== id
      )
    );
  };


  // ====================================================
  // CALCULATIONS
  // ====================================================

  const grossTotal = items.reduce(
    (total, item) =>
      total + item.qty * VOUCHER_DEFAULT_PRICE,
    0
  );

  const discountValue =
    discountType === "percent"
      ? (grossTotal *
          (Number(discountAmount) || 0)) /
        100
      : discountType === "fixed"
        ? Math.min(
            grossTotal,
            Number(discountAmount) || 0
          )
        : 0;

  const totalDue = Math.max(
    0,
    grossTotal - discountValue
  );

  const received =
    Number(totalReceived) || 0;

  const refund = Math.max(
    0,
    received - totalDue
  );


  // ====================================================
  // CASH / TOTAL RECEIVED SYNC
  // ====================================================

  const handleCashReceivedChange = (
    value: string
  ) => {

    setCashReceived(value);

    if (paymentMethod === "cash") {
      setTotalReceived(value);
    }
  };

  const handleTotalReceivedChange = (
    value: string
  ) => {

    setTotalReceived(value);

    if (paymentMethod === "cash") {
      setCashReceived(value);
    }
  };

  const handleMethodChange = (
    method: PaymentMethod
  ) => {

    setPaymentMethod(method);

    if (method === "cash") {
      setCashReceived(totalReceived);
    }
  };


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
  // SAVE
  // ====================================================

  const handleSave = useCallback(() => {

    if (items.length === 0) {
      showToast(
        "No vouchers added to save",
        "error"
      );
      return;
    }

    showToast(
      `Sale saved — ${totalDue.toFixed(2)} BDT`,
      "success"
    );
  }, [items, totalDue, showToast]);


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

    window.addEventListener(
      "keydown",
      onKeyDown
    );

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
      {/* TOP FORM ROW */}
      {/* ================================================= */}

      <section className="
        shrink-0
        border-b
        border-[#D9DED5]
        bg-white
        p-[clamp(6px,0.8vw,12px)]
      ">

        <VoucherForm
          serial={serialInput}
          expireDate={expireDateInput}
          onSerialChange={setSerialInput}
          onExpireDateChange={
            setExpireDateInput
          }
          onAdd={handleAddVoucher}
        />

      </section>


      {/* ================================================= */}
      {/* MAIN AREA */}
      {/* ================================================= */}

      <div className="
        grid
        min-h-0
        min-w-0
        flex-1
        grid-cols-[minmax(0,1fr)_minmax(280px,min(22%,400px))]
        gap-[clamp(6px,0.8vw,12px)]
        overflow-hidden
      ">


        {/* ================================================= */}
        {/* LEFT PANEL — ITEMS TABLE */}
        {/* ================================================= */}

        <section className="
          flex
          min-h-0
          min-w-0
          flex-col
          overflow-hidden
          border
          border-[#D9DED5]
          bg-white
        ">

          <VoucherTable
            items={items}
            onQtyStep={handleQtyStep}
            onRemove={handleRemove}
          />

        </section>


        {/* ================================================= */}
        {/* RIGHT PANEL — CHECKOUT SUMMARY */}
        {/* ================================================= */}

        <CheckoutSummary
          totalDue={totalDue}
          discountType={discountType}
          discountAmount={discountAmount}
          totalReceived={totalReceived}
          refund={refund}
          customerPhone={customerPhone}
          paymentMethod={paymentMethod}
          cashReceived={cashReceived}
          onDiscountTypeChange={
            setDiscountType
          }
          onDiscountAmountChange={
            setDiscountAmount
          }
          onTotalReceivedChange={
            handleTotalReceivedChange
          }
          onCustomerPhoneChange={
            setCustomerPhone
          }
          onMethodChange={
            handleMethodChange
          }
          onCashReceivedChange={
            handleCashReceivedChange
          }
        />

      </div>


      {/* ================================================= */}
      {/* BOTTOM ACTION BAR */}
      {/* ================================================= */}

      <footer className="
        flex
        shrink-0
        items-center
        justify-end
        gap-1.5
        border-t
        border-[#D9DED5]
        bg-white
        p-[clamp(6px,0.8vw,12px)]
      ">

        <ActionButton
          icon={<Printer size={13} />}
          text="Reprint"
          onClick={() =>
            showToast(
              "Reprint request sent",
              "success"
            )
          }
        />

        <ActionButton
          icon={<Search size={13} />}
          text="SEARCH"
          onClick={() =>
            document
              .getElementById(
                "voucher-serial-input"
              )
              ?.focus()
          }
        />

        <ActionButton
          icon={<Save size={13} />}
          text="Save [F2]"
          primary
          onClick={handleSave}
        />

      </footer>


      {/* ================================================= */}
      {/* TOAST */}
      {/* ================================================= */}

      {toast && (
        <div className="
          fixed
          bottom-16
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

export default VoucherEntry;
