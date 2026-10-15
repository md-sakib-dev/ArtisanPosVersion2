import {
  AlertTriangle,
  Scan,
  Package,
  Hash,
  Plus,
  Phone,
  Settings,
  Percent,
  Printer,
  FileText,
  ArrowLeftRight,
  Play,
  Pause,
  Save,
  CreditCard,
  Smartphone,
  Receipt,
  Ticket,
  Gift,
  Trash2,
  Maximize2,
  Minimize2,
  X,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import logo from "../../assets/logo.png"
import { useEffect, useRef, useState, type ReactNode } from "react";
import {getProductByBarcode} from "../../api/productApi";
import { Link } from "react-router-dom";
import type { MasterProduct } from "../../types/product";
import CardPaymentModal from "../../components/CardPaymentModal";
import MfsPaymentModal from "../../components/MfsPaymentModal";
import SlipPaymentModal from "../../components/SlipPaymentModal";
import VoucherPaymentModal from "../../components/VoucherPaymentModal";
import CustomerInfoModal from "../../components/CustomerInfoModal";
import ResumeInvoiceModal from "../../components/ResumeInvoiceModal";
import BillReceipt from "../../components/BillReceipt";
import {
  DEFAULT_STORE_INFO,
  formatReceiptDate,
  type BillItem,
  type BillSaleData,
} from "../../utils/billReceipt";
import {
  PAYMENT_CHANNEL_IDS,
  type ChannelPaymentEntry,
} from "../../types/payment";
import {
  getCustomerByPhone,
  type RegularSaleCustomer,
} from "../../api/customerApi";
import {
  createRegularSale,
  postTempSalesInfo,
  getTempSalesInfo,
  type RegularSaleDetailDto,
  type RegularSalePayload,
  type RegularSalePaymentDto,  createPausedSale,
  type PausedSalePayload,
  type PausedInvoiceDetailDto,
  type PausedInvoiceListItemDto,
} from "../../api/regularSaleApi";
import { classifyApiError } from "../../api/apiError";
import {
  getTransactionChannelOptions,
  toChannelDropdownOptions,
  type TransactionChannelOption,
} from "../../api/transactionChannelApi";
import { useAuth } from "../../contexts/AuthContext";

// ======================================================
// TYPES
// ======================================================


interface CartProduct extends MasterProduct {
  qty: number;
  spCode: string;
}

// ======================================================
// SAMPLE PRODUCTS
// ======================================================



// ======================================================
// REUSABLE STYLES
// ======================================================

// const inputClass = `
//   h-9
//   w-full
//   rounded-md
//   border
//   border-[#DDE5DF]
//   bg-white
//   px-3
//   text-sm
//   text-[#17231D]
//   outline-none
//   transition
//   placeholder:text-[#9AA29C]
//   focus:border-[#0E9351]
//   focus:ring-2
//   focus:ring-[#0E9351]/15
// `;

const smallInputClass = `
  h-8
  w-full
  rounded-md
  border
  border-[#DDE5DF]
  bg-white
  px-2.5
  text-sm
  text-[#17231D]
  outline-none
  transition
  focus:border-[#0E9351]
  focus:ring-2
  focus:ring-[#0E9351]/15
`;
const smallAdjnputClass = `
  h-8
  w-32
  rounded-md
  border
  border-[#DDE5DF]
  bg-white
  px-2.5
  text-sm
  text-[#17231D]
  outline-none
  transition
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
  px-3
  text-sm
  font-medium
  text-[#10673E]
  transition
  hover:border-[#0E9351]
  hover:bg-[#F1F8F3]
  active:scale-[0.98]
`;

const primaryButtonClass = `
  inline-flex
  h-9
  items-center
  justify-center
  gap-1.5
  rounded-md
  bg-[#0E9351]
  px-4
  text-sm
  font-semibold
  text-white
  transition
  hover:bg-[#10673E]
  active:scale-[0.98]
`;

// ======================================================
// PAYMENT MODAL
// ======================================================

interface PaymentModalProps {
  open: boolean;
  title: string;
  amount: number;
  setAmount: (amount: number) => void;
  onClose: () => void;
}

function PaymentModal({
  open,
  title,
  amount,
  setAmount,
  onClose,
}: PaymentModalProps) {
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
    >
      <div
        className="
        w-full
        max-w-md
        overflow-hidden
        rounded-xl
        border
        border-[#DDE5DF]
        bg-white
        shadow-2xl
      "
      >
        <div
          className="
          flex
          items-center
          justify-between
          border-b
          border-[#E6EAE3]
          px-5
          py-4
        "
        >
          <div>
            <p
              className="
              text-sm
              font-semibold
              uppercase
              tracking-wider
              text-[#66736B]
            "
            >
              Payment
            </p>

            <h2
              className="
              mt-0.5
              text-lg
              font-semibold
              text-[#17231D]
            "
            >
              {title}
            </h2>
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
            <X size={19} />
          </button>
        </div>

        <div className="p-5">
          <label
            className="
            mb-2
            block
            text-sm
            font-medium
            text-[#66736B]
          "
          >
            Amount
          </label>

          <input
            autoFocus
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="
              h-11
              w-full
              rounded-md
              border
              border-[#DDE5DF]
              px-3
              text-lg
              font-semibold
              text-[#17231D]
              outline-none
              focus:border-[#0E9351]
              focus:ring-2
              focus:ring-[#0E9351]/15
            "
          />

          <div
            className="
            mt-5
            flex
            justify-end
            gap-2
          "
          >
            <button
              type="button"
              onClick={onClose}
              className={secondaryButtonClass}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onClose}
              className={primaryButtonClass}
            >
              Add Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// BILL HELPERS
// ======================================================

/* The save response may carry an invoice number in one of a few keys. */
const readInvoiceNo = (data: unknown): string | null => {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const value =
      record.invoiceNo ?? record.invoiceNumber ?? record.invoiceID;

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }

  return null;
};

/* Fallback: digits built from branch, counter and the sale timestamp. */
const buildFallbackInvoiceNo = (
  branchId: number,
  counterId: number,
  when: Date,
): string => {
  const stamp = [
    String(when.getFullYear()).slice(-2),
    String(when.getMonth() + 1).padStart(2, "0"),
    String(when.getDate()).padStart(2, "0"),
    String(when.getHours()).padStart(2, "0"),
    String(when.getMinutes()).padStart(2, "0"),
    String(when.getSeconds()).padStart(2, "0"),
  ].join("");

  return `${branchId}${String(counterId).padStart(2, "0")}${stamp}`;
};

// ======================================================
// SALE ENTRY
// ======================================================

function SaleEntry() {
  // ====================================================
  // PRODUCT INPUT
  // ====================================================
  const { user } = useAuth();
  const myBranchId = user?.branchId ?? 0;
  const counterId = user?.counterId ?? 0;
  const [barcodeInput, setBarcodeInput] = useState("");

  const [spCodeInput, setSpCodeInput] = useState("");

  const [qtyInput, setQtyInput] = useState<number>(1);

  const [isSpEnabled, setIsSpEnabled] = useState(false);

  // ====================================================
  // CUSTOMER
  // ====================================================

  const [phoneNumber, setPhoneNumber] = useState("");

  // ====================================================
  // DISCOUNT
  // ====================================================

  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);

  const [adjustment, setAdjustment] = useState<number>(0);

  // ====================================================
  // CART
  // ====================================================

  const [products, setProducts] = useState<CartProduct[]>([]);

  // ====================================================
  // PAYMENTS
  // ====================================================

  const [cashReceived, setCashReceived] = useState<number>(0);
  const [refundType, setRefundType] = useState<string>("Cash");

  const [isCardPaymentModalOpen, setIsCardPaymentModalOpen] = useState(false);



  const [walletAmount, setWalletAmount] = useState<number>(0);

  // ====================================================
  // PAYMENT MODALS
  // ====================================================

  /* Per-entry payment summaries from each modal (amount + channel option). */
  const [cardEntries, setCardEntries] = useState<ChannelPaymentEntry[]>([]);

  const [isMfsPaymentModalOpen, setIsMfsPaymentModalOpen] = useState(false);
  const [mfsEntries, setMfsEntries] = useState<ChannelPaymentEntry[]>([]);

  const [isSlipPaymentModalOpen, setIsSlipPaymentModalOpen] = useState(false);
  const [slipEntries, setSlipEntries] = useState<ChannelPaymentEntry[]>([]);

  const [isVoucherPaymentModalOpen, setIsVoucherPaymentModalOpen] = useState(false);
  const [voucherEntries, setVoucherEntries] = useState<ChannelPaymentEntry[]>([]);

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [mfsModalResetKey, setMfsModalResetKey] = useState(0);

  /* Every payment type (Cash / MFS / Card / POS Machine / Voucher / Slip),
     loaded once with the screen. Each payment modal fills its dropdowns
     from here by channel id — no extra request per modal. */
  const [transactionChannelOptions, setTransactionChannelOptions] = useState<
    TransactionChannelOption[]
  >([]);

  // ====================================================
  // SAVE (POST /api/RegularSales)
  // ====================================================

  const [isSaving, setIsSaving] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  /* Set when the temp-sale sync of a scanned line failed. */
  const [syncWarning, setSyncWarning] = useState<string | null>(null);

  /* Inline success/error notice shown beside the Save button. */
  const [saveNotice, setSaveNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  /* Change due to the customer, surfaced in a modal after a successful save. */
  const [changeModal, setChangeModal] = useState<{
    amount: number;
    type: string;
    refNo: string;
  } | null>(null);

  /* Printable bill snapshot shown (and auto-printed) after a sale. */
  const [billData, setBillData] = useState<{
    sale: BillSaleData;
    items: BillItem[];
  } | null>(null);

  /* CS No — reference number used when the change is paid by slip. */
  const [changeRefNo, setChangeRefNo] = useState("");

  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false);

  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  const [customerInfo, setCustomerInfo] =
    useState<RegularSaleCustomer | null>(null);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);

  // ====================================================
  // DELETE AUTHORIZATION
  // ====================================================

  const DELETE_PASSWORD = "1234";
  const [deleteAuthOpen, setDeleteAuthOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState(false);

  // ====================================================
  // FULLSCREEN
  // ====================================================

  const [isFullScreen, setIsFullScreen] = useState(false);

  // ====================================================
  // ADD PRODUCT
  // ====================================================

  // useEffect(() => {
  //   const fetchProducts = async () => {
  //     try {
  //       const products = await getProducts();
  //       setMasterProducts(products);
  //     } catch (error) {
  //       console.error("Error fetching products:", error);
  //     }
  //   };

  //   fetchProducts();
  // }, []);

  // const handleAddProduct = () => {
  //   const foundProduct = masterProducts.find(
  //     (product) => product.barcode === barcodeInput.trim(),
  //   );

  //   if (!foundProduct) {
  //     alert("Product not found");
  //     return;
  //   }

  //   const quantity = Number(qtyInput);

  //   if (quantity <= 0) {
  //     alert("Quantity must be greater than 0");
  //     return;
  //   }

  //   setProducts((previousProducts) => {
  //     const existingIndex = previousProducts.findIndex(
  //       (product) => product.barcode === foundProduct.barcode,
  //     );

  //     if (existingIndex !== -1) {
  //       const updatedProducts = [...previousProducts];

  //       const existingProduct = updatedProducts[existingIndex];

  //       updatedProducts[existingIndex] = {
  //         ...existingProduct,
  //         qty: existingProduct.qty + quantity,
  //         spCode: spCodeInput || existingProduct.spCode,
  //       };

  //       return updatedProducts;
  //     }

  //     return [
  //       ...previousProducts,
  //       {
  //         ...foundProduct,
  //         qty: quantity,
  //         spCode: spCodeInput,
  //       },
  //     ];
  //   });

  //   setBarcodeInput("");
  //   setSpCodeInput("");
  //   setQtyInput(1);
  // };

  // ====================================================
  // DELETE PRODUCT
  // ====================================================
const handleAddProduct = async () => {
  const barcode = barcodeInput.trim();

  if (!barcode) {
    alert("Please enter a barcode");
    return;
  }

  const quantity = Number(qtyInput);

  if (quantity <= 0) {
    alert("Quantity must be greater than 0");
    return;
  }

  try {
    const foundProduct = await getProductByBarcode(barcode);

    if (!foundProduct) {
      alert("Product not found");
      return;
    }

    /* Keep the backend's temp sale in sync with this add. A failure
       must not block the cashier: the line is still added locally and
       a dismissible warning is shown instead. */
    try {
      const syncResult = await postTempSalesInfo({
        branchId: user?.branchId ?? 0,
        counterId: user?.counterId ?? 0,
        userName: user?.username ?? "",
        productId: foundProduct.id,
        barcode: foundProduct.barcode,
        qty: quantity,
        customerContact: phoneNumber.trim(),
      });

      if (syncResult?.success === false) {
        setSyncWarning(
          syncResult.message || "Temp sale sync failed for this product.",
        );
      } else {
        setSyncWarning(null);
      }
    } catch (error) {
      console.error("Temp sales info error:", error);
      setSyncWarning(
        classifyApiError(error)?.message ??
          "Temp sale sync failed for this product.",
      );
    }

    setProducts((previousProducts) => {
      const existingIndex = previousProducts.findIndex(
        (product) => product.barcode === foundProduct.barcode,
      );

      if (existingIndex !== -1) {
        const updatedProducts = [...previousProducts];

        const existingProduct = updatedProducts[existingIndex];

        updatedProducts[existingIndex] = {
          ...existingProduct,
          qty: existingProduct.qty + quantity,
          spCode: spCodeInput || existingProduct.spCode,
        };

        return updatedProducts;
      }

      return [
        ...previousProducts,
        {
          ...foundProduct,
          qty: quantity,
          spCode: spCodeInput,
        },
      ];
    });

    setBarcodeInput("");
    setSpCodeInput("");
    setQtyInput(1);

  } catch (error) {
    console.error("Error fetching product:", error);
    alert("Unable to retrieve product");
  }
};

  // ====================================================
  // CUSTOMER INFO
  // ====================================================

  const handleOpenCustomerInfo = async () => {
    const phone = phoneNumber.trim();

    if (!phone) {
      alert("Please enter a customer phone number");
      return;
    }

    setIsCustomerLoading(true);

    try {
      const customer = await getCustomerByPhone(phone);

      if (!customer) {
        alert("Customer not found");
        return;
      }

      setCustomerInfo(customer);
      setIsCustomerInfoOpen(true);
    } catch (error) {
      console.error("Error fetching customer:", error);
      alert("Unable to retrieve customer");
    } finally {
      setIsCustomerLoading(false);
    }
  };


  const handleDeleteClick = (id: number) => {
    setDeleteProductId(id);
    setDeletePassword("");
    setDeleteError(false);
    setDeleteAuthOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletePassword === DELETE_PASSWORD && deleteProductId !== null) {
      setProducts((previousProducts) =>
        previousProducts
          .map((product) =>
            product.id === deleteProductId
              ? { ...product, qty: product.qty - 1 }
              : product,
          )
          .filter((product) => product.qty > 0),
      );
      setDeleteAuthOpen(false);
      setDeleteProductId(null);
      setDeletePassword("");
      setDeleteError(false);
    } else {
      setDeleteError(true);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteAuthOpen(false);
    setDeleteProductId(null);
    setDeletePassword("");
    setDeleteError(false);
  };

  // ====================================================
  // CALCULATIONS
  // ====================================================

  const hasProductDiscount = products.some((product) => product.disc > 0);

  const grossTotal = products.reduce(
    (total, product) => total + product.qty * product.unitPrice,
    0,
  );

  const productDiscount = products.reduce(
    (total, product) =>
      total + (product.qty * product.unitPrice * product.disc) / 100,
    0,
  );

  const productTotal = grossTotal - productDiscount;

  const invoiceDiscountAmount = hasProductDiscount
    ? 0
    : (productTotal * invoiceDiscount) / 100;

  const totalVat = products.reduce((total, product) => {
    const discountedPrice =
      product.unitPrice - (product.unitPrice * product.disc) / 100;

    return total + (discountedPrice * product.qty * product.vat) / 100;
  }, 0);

  const netPayableBeforeVat = productTotal - invoiceDiscountAmount;

  const netPayable = netPayableBeforeVat + totalVat;

  const totalQty = products.reduce((total, product) => total + product.qty, 0);

  const totalItems = products.length;

  const totalSP = products.reduce(
    (total, product) => total + (product.spCode ? 1 : 0),
    0,
  );

  // ====================================================
  // PAYMENTS
  // ====================================================

  /* Totals are derived from the per-entry summaries each modal reports. */
  const cardPaymentTotal = cardEntries.reduce((sum, e) => sum + e.amount, 0);
  const mfsTotal = mfsEntries.reduce((sum, e) => sum + e.amount, 0);
  const slipTotal = slipEntries.reduce((sum, e) => sum + e.amount, 0);
  const voucherTotal = voucherEntries.reduce((sum, e) => sum + e.amount, 0);

  const totalReceived =
    Number(cashReceived) +
    Number(cardPaymentTotal) +
    Number(mfsTotal) +
    Number(slipTotal) +
    Number(voucherTotal) +
    Number(walletAmount);

  /* Change and due are clamped at zero — neither can go negative. */
  const change =
    totalReceived > netPayable
      ? Math.max(0, totalReceived - netPayable - Number(adjustment))
      : 0;

  const due =
    totalReceived < netPayable
      ? Math.max(0, netPayable - totalReceived - Number(adjustment))
      : 0;

  // ====================================================
  // SAVE SALE (POST /api/RegularSales)
  // ====================================================

  /* Money values are rounded to 2 decimals before leaving the client. */
  const r2 = (value: number) => Math.round(value * 100) / 100;

  /* Cart line → RegularSales detail DTO. */
  const buildDetail = (product: CartProduct): RegularSaleDetailDto => {
    const lineTotal = product.qty * product.unitPrice;
    const unitDiscAmt = (product.unitPrice * product.disc) / 100;
    const unitPriceAftrDiscount = product.unitPrice - unitDiscAmt;
    const totalPriceAftrDiscount =
      lineTotal - lineTotal * (product.disc / 100);

    return {
      productId: product.id,
      barcode: product.barcode,
      qty: product.qty,
      unitPrice: r2(product.unitPrice),
      totalPrice: r2(lineTotal),
      discountPercent: product.disc,
      discountAmt: r2(lineTotal - totalPriceAftrDiscount),
      unitPriceAftrDiscount: r2(unitPriceAftrDiscount),
      totalPriceAftrDiscount: r2(totalPriceAftrDiscount),
      unitVAT: r2((product.unitPrice * product.vat) / 100),
      unitVATAftrDiscount: r2((unitPriceAftrDiscount * product.vat) / 100),
      vatPercent: product.vat,
      vatCategoryId: 0,
      /* This screen prices products VAT-exclusive — VAT is added on
         top of the discounted price, so these amounts are not
         VAT-inclusive. */
      isIncludingVAT: false,
    };
  };

  const buildSalePayload = (): RegularSalePayload => {
    /* VAT on the undiscounted line totals (VAT before discount). */
    const vatBfrDiscount = products.reduce(
      (total, product) =>
        total + (product.qty * product.unitPrice * product.vat) / 100,
      0,
    );

    /* One payment row per entry that was actually used; each row carries
       the channelId and the channel option chosen in its modal. */
    const paymentRows: RegularSalePaymentDto[] = [];

    /* Rows that must be sent even with a 0 amount (the card-type row) are
       pushed directly instead of via addPayment. */
    const addPaymentRow = (
      channelId: number,
      channelOptionId: number,
      paidAmt = 0,
      refNo = "",
    ) => {
      paymentRows.push({ channelId, channelOptionId, paidAmt: r2(paidAmt), refNo });
    };

    /* Channel ids: Cash 1, MFS 2, Card 3, POS Machine 4, Voucher 5,
       Slip 6. Wallet has no configured channel yet, so it is sent as 0. */
    const addPayment = (
      channelId: number,
      paidAmt: number,
      channelOptionId = 0,
      refNo = "",
    ) => {
      if (paidAmt > 0) {
        paymentRows.push({
          channelId,
          channelOptionId,
          paidAmt: r2(paidAmt),
          refNo,
        });
      }
    };

    addPayment(PAYMENT_CHANNEL_IDS.cash, Number(cashReceived));

    /* A card payment sends two rows: the channel-3 row records which card
       type was used (amount 0) and the channel-4 row carries the money with
       the POS machine option id. */
    cardEntries.forEach((entry) => {
      const posMachineId = entry.posMachineId ?? 0;

      if (posMachineId > 0) {
        addPaymentRow(PAYMENT_CHANNEL_IDS.card, entry.channelOptionId);
        addPaymentRow(
          PAYMENT_CHANNEL_IDS.posMachine,
          posMachineId,
          entry.amount,
        );
        return;
      }

      /* No POS machine recorded on the entry — keep the amount on the card
         row so the payment is not lost. */
      addPayment(
        PAYMENT_CHANNEL_IDS.card,
        entry.amount,
        entry.channelOptionId,
      );
    });

    mfsEntries.forEach((entry) =>
      addPayment(PAYMENT_CHANNEL_IDS.mfs, entry.amount, entry.channelOptionId),
    );

    slipEntries.forEach((entry) =>
      addPayment(
        PAYMENT_CHANNEL_IDS.slip,
        entry.amount,
        entry.channelOptionId,
        entry.refNo ?? "",
      ),
    );

    voucherEntries.forEach((entry) =>
      addPayment(
        PAYMENT_CHANNEL_IDS.voucher,
        entry.amount,
        entry.channelOptionId,
      ),
    );

    addPayment(0, Number(walletAmount));

    return {
      master: {
        invoiceType: "Sale",
        branchId: user?.branchId ?? 0,
        counterId: user?.counterId ?? 0,
        userName: user?.username ?? "",
        customerContact: phoneNumber.trim(),
        invoiceDate: new Date().toISOString(),
        totalQty,
        totalProdPrice: r2(grossTotal),
        discountId: 0,
        discountPercent: invoiceDiscount,
        discountAmt: r2(productDiscount + invoiceDiscountAmount),
        adjustmentAmt: r2(Number(adjustment)),
        priceAftrDiscount: r2(netPayableBeforeVat),
        vatBfrDiscount: r2(vatBfrDiscount),
        vatAftrDiscount: r2(totalVat),
        returnAmt: 0,
        totalPayableAmt: r2(netPayable),
        totalPaid: r2(totalReceived),
        changeAmt: r2(change),
        changeType: refundType,
        changeRefNo: refundType === "Slip" ? changeRefNo.trim() : "",
      },
      details: products.map(buildDetail),
      payments: paymentRows,
    };
  };

  /* Clear the till for the next customer. */
  const resetSale = () => {
    setProducts([]);
    setBarcodeInput("");
    setSpCodeInput("");
    setQtyInput(1);
    setPhoneNumber("");
    setCustomerInfo(null);
    setInvoiceDiscount(0);
    setAdjustment(0);
    setCashReceived(0);
    setRefundType("Cash");
    setChangeRefNo("");
    setCardEntries([]);
    setMfsEntries([]);
    setSlipEntries([]);
    setVoucherEntries([]);
    setWalletAmount(0);
    setSyncWarning(null);
  };

  const handleSaveSale = async () => {
    if (products.length === 0) {
      setSaveNotice({
        type: "error",
        message: "Add at least one product before saving the sale.",
      });
      return;
    }

    if (!phoneNumber.trim()) {
      setSaveNotice({
        type: "error",
        message: "Customer phone number is required.",
      });
      return;
    }

    if (due > 0) {
      setSaveNotice({
        type: "error",
        message: `Cannot save \u2014 the sale still has a due of ${due.toFixed(2)}.`,
      });
      return;
    }

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveNotice(null);

    /* Captured before resetSale() clears the till. */
    const changeAmount = change;
    const changeType = refundType;
    const changeRef = changeRefNo;

    try {
      const result = await createRegularSale(buildSalePayload());

      if (result?.success === false) {
        setSaveNotice({
          type: "error",
          message: result.message || "The sale could not be saved.",
        });
        return;
      }

      /* Snapshot everything the receipt needs before the till is cleared. */
      const billItems: BillItem[] = products.map((product) => ({
        name: product.prodName,
        barcode: product.barcode,
        vatPercent: product.vat,
        qty: product.qty,
        unitPrice: product.unitPrice,
        total: r2(product.qty * product.unitPrice),
      }));

      const paymentParts = [
        Number(cashReceived) > 0 ? "Cash" : null,
        Number(cardPaymentTotal) > 0 ? "Card" : null,
        Number(mfsTotal) > 0 ? "MFS" : null,
        Number(slipTotal) > 0 ? "Slip" : null,
        Number(voucherTotal) > 0 ? "Voucher" : null,
        Number(walletAmount) > 0 ? "Wallet" : null,
      ].filter((part): part is string => part !== null);

      const billSnapshot: BillSaleData = {
        invoiceNo:
          readInvoiceNo(result?.data) ??
          buildFallbackInvoiceNo(myBranchId, counterId, new Date()),
        date: formatReceiptDate(new Date()),
        invoiceBy: user?.displayName || user?.username || "Cashier",
        totalQty,
        totalProductPrice: r2(grossTotal),
        discountPercent: invoiceDiscount,
        discountAmount: r2(productDiscount + invoiceDiscountAmount),
        adjustmentAmount: r2(Number(adjustment)),
        subTotal: r2(netPayableBeforeVat),
        exchangedProductAmount: 0,
        vatAmount: r2(totalVat),
        totalPayable: r2(netPayable),
        cashAmount: r2(Number(cashReceived)),
        cardAmount: r2(Number(cardPaymentTotal)),
        mfsAmount: r2(Number(mfsTotal)),
        slipAmount: r2(Number(slipTotal)),
        voucherAmount: r2(Number(voucherTotal)),
        totalReceived: r2(totalReceived),
        changeAmount: r2(changeAmount),
        paymentMode: paymentParts.length ? paymentParts.join(" + ") : "Cash",
      };

      resetSale();
      setMfsModalResetKey((prev) => prev + 1); // Reset MFS modal state
      setSaveNotice({ type: "success", message: "Sale saved successfully." });

      /* Show the bill and auto-trigger the print dialog. */
      setBillData({ sale: billSnapshot, items: billItems });

      /* Surface the change due to the customer. */
      if (changeAmount > 0) {
        setChangeModal({
          amount: changeAmount,
          type: changeType,
          refNo: changeRef,
        });
      }
    } catch (error) {
      console.error("Save sale error:", error);
      setSaveNotice({
        type: "error",
        message: classifyApiError(error)?.message ?? "Unable to save the sale.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handlePauseSale = async () => {

    if (products.length === 0) {
      setSaveNotice({
        type: "error",
        message: "Add at least one product before pausing the sale.",
      });
      return;
    }
    if (!phoneNumber.trim()) {
      setSaveNotice({
        type: "error",
        message: "Customer phone number is required.",
      });
      return;
    }
    if (isPausing) {
      return;
    }
    setIsPausing(true);
    setSaveNotice(null);
    try{
      const payload: PausedSalePayload = {
        master: {
          invoiceType: "REGULAR",
          branchId: user?.branchId ?? 0,
          counterId: user?.counterId ?? 0,
          CustomerContact: phoneNumber.trim(),
      },
      details: products.map((product) => ({
        productId: product.id,
        barcode: product.barcode, 
        qty: product.qty, 

    })),
    };
    const result = await createPausedSale(payload);
    if (result&&(result as any)?.success===false) {
      setSaveNotice({
        type: "error",
        message: (result as any)?.message ?? "Unable to pause the sale.",
      });
    }
    resetSale();
   setMfsModalResetKey((prev) => prev + 1); // Reset MFS modal state
   setSaveNotice({ type: "success", message: "Sale paused successfully." });
    }
    catch (error) {
      console.error("Pause sale error:", error);
      setSaveNotice({
        type: "error",
        message: classifyApiError(error)?.message ?? "Unable to pause the sale.",
      });
    }
    finally {
      setIsPausing(false);
    }
  }
  

  // ====================================================
  // RESUME PAUSED INVOICE
  // ====================================================

  /* Drop the fetched paused-invoice lines straight into the sale table,
     mirroring the temp-sale mapping (the detail rows only carry a subset
     of a full product, so the remaining fields get safe defaults). */
  const handleResumeLoad = (
    items: PausedInvoiceDetailDto[],
    invoice: PausedInvoiceListItemDto,
  ) => {
    const mappedProducts: CartProduct[] = items.map((item) => ({
      id: item.productId,
      barcode: item.barcode,
      prodName: item.fullName || item.shortName,
      group: "",
      type: "",
      category: null,
      style: null,
      brandName: "",
      size: "",
      color: null,
      unitPrice: item.salesPrice,
      disc: 0,
      vat: item.vatPercent,
      productDescription: "",
      qty: item.qty,
      spCode: "",
    }));

    setProducts(mappedProducts);

    if (invoice.customerContact) {
      setPhoneNumber(invoice.customerContact);
    }

    setIsResumeModalOpen(false);
    setSaveNotice({
      type: "success",
      message: `Paused invoice ${invoice.invoiceNo} loaded.`,
    });
  };

  /* Notices fade away on their own after 3 seconds. */
  useEffect(() => {
    if (!saveNotice) return;

    const timeoutId = setTimeout(() => setSaveNotice(null), 3000);
    return () => clearTimeout(timeoutId);
  }, [saveNotice]);

  /* The action bar labels the button "Save [F2]" — keep F2 working. */
  const saveSaleRef = useRef<() => void>(() => {});

  useEffect(() => {
    saveSaleRef.current = handleSaveSale;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault();
        saveSaleRef.current();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    
  }, []);

  useEffect(() => {
  const loadTempSales = async () => {
    if (!myBranchId || !counterId) {
      console.warn(
        "[sale] Skipping temp-sale load — branchId/counterId not ready.",
        { branchId: myBranchId, counterId },
      );
      return;
    }

    try {
      console.log("[sale] Loading temp sales for:", {
        branchId: myBranchId,
        counterId,
      });

      const res = await getTempSalesInfo(myBranchId, counterId);

      console.log("[sale] Temp sales result:", res);

      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Map backend DTO fields to match the CartProduct[] structure. The
        // temp-sale row only carries a subset of a full product, so the
        // remaining MasterProduct fields are filled with safe defaults.
        const mappedProducts: CartProduct[] = res.data.map((item) => ({
          id: item.productId,
          barcode: item.barcode,
          prodName: item.fullName || item.shortName,
          group: "",
          type: "",
          category: null,
          style: null,
          brandName: "",
          size: "",
          color: null,
          unitPrice: item.salesPrice,
          disc: 0,
          vat: item.vatPercent,
          productDescription: "",
          qty: item.qty,
          spCode: "",
        }));

        setProducts(mappedProducts);

        // Restore the customer phone that was saved with the temp sale.
        const tempContact = res.data.find(
          (item) => item.customerContact,
        )?.customerContact;

        if (tempContact) {
          setPhoneNumber(tempContact);
        }
      } else {
        console.warn(
          "[sale] No temp sales loaded:",
          res.message || "empty response",
          { branchId: myBranchId, counterId, data: res.data },
        );
      }
    } catch (err) {
      console.error("Failed to load temporary sales:", err);
    }
  };

  loadTempSales();
}, [myBranchId, counterId]);

  /* Payment-type dropdown values for every modal: GET /api/TransactionChannelOptions
     once on page load. Every option's value IS the channelOptionId that the
     sale POST sends back with the payment row. */
  useEffect(() => {
    let cancelled = false;

    getTransactionChannelOptions()
      .then((res) => {
        if (cancelled) return;
        setTransactionChannelOptions(Array.isArray(res.data) ? res.data : []);
      })
      .catch((error) => {
        console.error("Transaction channel options error:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Card modal: card type = channel 3, POS machine = channel 4. */
  const cardChannelOptions = toChannelDropdownOptions(
    transactionChannelOptions,
    PAYMENT_CHANNEL_IDS.card,
  );

  const posMachineOptions = toChannelDropdownOptions(
    transactionChannelOptions,
    PAYMENT_CHANNEL_IDS.posMachine,
  );

  /* MFS modal: provider = channel 2. */
  const mfsChannelOptions = toChannelDropdownOptions(
    transactionChannelOptions,
    PAYMENT_CHANNEL_IDS.mfs,
  );

  /* Slip modal: slip type = channel 6. */
  const slipChannelOptions = toChannelDropdownOptions(
    transactionChannelOptions,
    PAYMENT_CHANNEL_IDS.slip,
  );

  /* Voucher modal: voucher type = channel 5. */
  const voucherChannelOptions = toChannelDropdownOptions(
    transactionChannelOptions,
    PAYMENT_CHANNEL_IDS.voucher,
  );

  // ====================================================
  // FULLSCREEN
  // ====================================================

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();

        setIsFullScreen(true);
      } else {
        await document.exitFullscreen();

        setIsFullScreen(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div
      className="
      flex
      h-full
      w-full
      overflow-hidden
      bg-[#F5F7F3]
      p-2
      text-[#17231D]
    "
    >
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

      {/* ================================================= */}
      {/* POS HEADER */}
      {/* ================================================= */}

      <header
        className="
        flex
        h-11
        shrink-0
        items-center
        justify-between
        border-b
        border-[#DDE5DF]
        bg-[#10673E]
        px-3
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
          <div>
          <Link to="/dashboard"><img
          src={logo}
          alt="Company Logo"
          className="h-8 w-auto object-contain"
        /></Link>
        </div>
          <div
            className="
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-md
            bg-white/10
          "
          >
            
              <ShoppingCart size={16} />
            
          </div>

          <div>
            <p
              className="
              text-sm
              font-semibold
              leading-none
            "
            >
              Sales Entry
            </p>

            <p
              className="
              mt-0.5
              text-sm
              text-white/60
            "
            >
              Point of Sale
            </p>
          </div>
          
        </div>
        

        <div
          className="
          flex
          items-center
          gap-5
          text-sm
          text-white/70
        "
        >
          <span>
            Branch: <b className="text-white">{myBranchId || "--"}</b>
          </span>

          <span>
            Counter: <b className="text-white">{counterId || "--"}</b>
          </span>

          <span>
            User:{" "}
            <b className="text-white">
              {user?.displayName || user?.username || "Cashier"}
            </b>
          </span>

          <button
            type="button"
            onClick={toggleFullScreen}
            className="
              rounded-md
              p-1.5
              text-white/70
              hover:bg-white/10
              hover:text-white
            "
          >
            {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>

        </header>

      {/* ================================================= */}
      {/* MAIN AREA — INPUT + TABLE (left) | PAYMENT (right) */}
      {/* ================================================= */}

      <div
        className="
        mt-2
        flex
        min-h-0
        flex-1
        flex-col
        overflow-hidden
      "
      >
        {/* LEFT COLUMN: TOP INPUT + PRODUCT TABLE */}
          {/* TOP INPUT AREA */}

          <section
            className="
            shrink-0
            border
            border-[#DDE5DF]
            bg-white
            p-2.5
          "
          >
            <div className="flex flex-col gap-3 xl:flex-row">
              {/* PRODUCT INPUT */}
              <div className="flex flex-1 gap-2">
                {/* Barcode - bigger */}
                <div className="flex-[1.6]">
                  <Field label="Barcode" icon={<Scan size={13} />}>
                    <div className="flex gap-1.5">
                      <input
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddProduct();
                          }
                        }}
                        className={smallInputClass}
                        placeholder="Scan barcode"
                      />

                      <label
                        className="
              flex h-8 w-8 shrink-0 cursor-pointer
              items-center justify-center rounded-md
              border border-[#DDE5DF]
              bg-[#F1F8F3]
            "
                      >
                        <input
                          type="checkbox"
                          checked={isSpEnabled}
                          onChange={(e) => setIsSpEnabled(e.target.checked)}
                          className="h-3.5 w-3.5 accent-[#0E9351]"
                        />
                      </label>
                    </div>
                  </Field>
                </div>

                {/* SP Code */}
                <div className="flex-1">
                  <Field label="SP Code" icon={<Package size={13} />}>
                    <input
                      value={spCodeInput}
                      disabled={!isSpEnabled}
                      onChange={(e) => setSpCodeInput(e.target.value)}
                      className="
            h-8 w-full rounded-md
            border border-[#DDE5DF]
            bg-white px-2.5 text-sm
            outline-none
            focus:border-[#0E9351]
            disabled:cursor-not-allowed
            disabled:bg-[#F3F4F2]
            disabled:text-gray-400
          "
                      placeholder="SP code"
                    />
                  </Field>
                </div>

                {/* Quantity */}
                <div className="w-28 shrink-0">
                  <Field label="Quantity" icon={<Hash size={13} />}>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min={1}
                        value={qtyInput}
                        onChange={(e) => setQtyInput(Number(e.target.value))}
                        className="
              h-8 min-w-0 flex-1
              rounded-md border border-[#DDE5DF]
              px-2 text-center text-sm
              outline-none
              focus:border-[#0E9351]
            "
                      />

                      <button
                        type="button"
                        onClick={handleAddProduct}
                        className="
              flex h-8 w-8 shrink-0
              items-center justify-center
              rounded-md bg-[#0E9351]
              text-white transition
              hover:bg-[#10673E]
            "
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </Field>
                </div>
              </div>

              {/* CUSTOMER / DISCOUNT */}
              <div className="flex flex-1 gap-2">
                {/* Customer Phone */}
                <div className="flex-[1.3]">
                  <Field label="Customer Phone *" icon={<Phone size={13} />}>
                    <div className="flex gap-1.5">
                      <input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="h-8 min-w-0 flex-1 rounded-md border border-[#DDE5DF] bg-white px-2.5 text-sm text-[#17231D] outline-none placeholder:text-[#9AA29C] focus:border-[#0E9351] focus:ring-2 focus:ring-[#0E9351]/15"
                        placeholder="Phone number"
                      />
                      <button
                        type="button"
                        onClick={handleOpenCustomerInfo}
                        disabled={isCustomerLoading}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#DDE5DF] bg-[#F1F8F3] text-[#10673E] transition-all hover:border-[#0E9351] hover:bg-[#E8F5ED] disabled:cursor-not-allowed disabled:opacity-50"
                        title="Customer Info"
                      >
                        <UserRound size={14} />
                      </button>
                    </div>
                  </Field>
                </div>

                {/* Adjustment */}
                <div className="flex-1">
                  <Field label="Adjustment" icon={<Settings size={13} />}>
                    <input
                      type="number"
                      value={adjustment === 0 ? "" : adjustment}
                      onChange={(e) =>
                        setAdjustment(
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                      className={smallAdjnputClass}
                    />
                  </Field>
                </div>

                {/* Invoice Discount */}
                <div className="flex-1">
                  <Field label=" Discount" icon={<Percent size={13} />}>
                    <select
                      value={invoiceDiscount}
                      onChange={(e) =>
                        setInvoiceDiscount(Number(e.target.value))
                      }
                      disabled={hasProductDiscount}
                      className="
            h-8 w-full rounded-md
            border border-[#DDE5DF]
            bg-white px-2 text-sm
            outline-none
            focus:border-[#0E9351]
            disabled:bg-[#F3F4F2]
          "
                    >
                      <option value={0}>No Discount</option>
                      <option value={5}>5%</option>
                      <option value={10}>10%</option>
                      <option value={15}>15%</option>
                      <option value={20}>20%</option>
                    </select>
                  </Field>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* TEMP SALE SYNC WARNING */}
          {/* ================================================= */}

          {syncWarning && (
            <div
              className="
              mt-2
              flex
              shrink-0
              items-center
              gap-2
              rounded-md
              border
              border-[#E2BA48]
              bg-[#FFF8E5]
              px-3
              py-2
              text-sm
              text-[#8A6B00]
            "
            >
              <AlertTriangle size={14} className="shrink-0" />

              <span className="min-w-0 flex-1">{syncWarning}</span>

              <button
                type="button"
                onClick={() => setSyncWarning(null)}
                className="rounded p-0.5 transition hover:bg-black/5"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ================================================= */}
          {/* PRODUCT TABLE */}
          {/* ================================================= */}

          <section
            className="
            flex
            min-h-0
            min-w-0
            flex-1
            flex-col
            overflow-hidden
            border
            border-[#DDE5DF]
            bg-white
          "
          >
            {
              /* <div
            className="
            flex
            h-9
            shrink-0
            items-center
            justify-between
            border-b
            border-[#DDE5DF]
            bg-[#F1F8F3]
            px-3
          "
          >
            <div
              className="
              flex
              items-center
              gap-2
            "
            >
              <ShoppingCart size={14} className="text-[#10673E]" />

              <span
                className="
                text-sm
                font-semibold
                text-[#10673E]
              "
              >
                Sale Items
              </span>

              <span
                className="
                rounded-full
                bg-[#E8F5ED]
                px-2
                py-0.5
                text-sm
                font-semibold
                text-[#66736B]
              "
              >
                {totalItems}
              </span>
            </div>

            <span
              className="
              text-sm
              text-[#66736B]
            "
            >
              {totalQty} units
            </span>
          </div> */

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
              min-w-[850px]
              border-collapse
              text-sm
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
                    text-sm
                    font-semibold
                  "
                      >
                        Barcode
                      </th>

                      <th
                        className="
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    font-semibold
                  "
                      >
                        Product
                      </th>

                      <th
                        className="
                    px-3
                    py-2.5
                    text-center
                    text-sm
                    font-semibold
                  "
                      >
                        Qty
                      </th>

                      <th
                        className="
                    px-3
                    py-2.5
                    text-right
                    text-sm
                    font-semibold
                  "
                      >
                        Unit Price
                      </th>

                      <th
                        className="
                    px-3
                    py-2.5
                    text-center
                    text-sm
                    font-semibold
                  "
                      >
                        Disc%
                      </th>

                      <th
                        className="
                    px-3
                    py-2.5
                    text-right
                    text-sm
                    font-semibold
                  "
                      >
                        Total
                      </th>

                      <th
                        className="
                    px-3
                    py-2.5
                    text-right
                    text-sm
                    font-semibold
                  "
                      >
                        Net Price
                      </th>

                      <th
                        className="
                    px-3
                    py-2.5
                    text-center
                    text-sm
                    font-semibold
                  "
                      >
                        SP
                      </th>

                      <th
                        className="
                    px-3
                    py-2.5
                    text-center
                    text-sm
                    font-semibold
                  "
                      >
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="
                        py-16
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
                            <ShoppingCart size={30} strokeWidth={1.5} />

                            <p
                              className="
                          mt-2
                          text-sm
                          font-medium
                        "
                            >
                              No products added
                            </p>

                            <p
                              className="
                          mt-1
                          text-sm
                        "
                            >
                              Scan a barcode to add products
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => {
                        const total = product.qty * product.unitPrice;

                        const discountedTotal =
                          total - (total * product.disc) / 100;

                        return (
                          <tr
                            key={product.id}
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
                            text-[#66736B]
                          "
                            >
                              {product.barcode}
                            </td>

                            <td
                              className="
                            px-3
                            py-2.5
                            font-medium
                            text-[#17231D]
                          "
                            >
                              {product.prodName}
                            </td>

                            <td
                              className="
                            px-3
                            py-2.5
                            text-center
                            font-medium
                          "
                            >
                              {product.qty}
                            </td>

                            <td
                              className="
                            px-3
                            py-2.5
                            text-right
                          "
                            >
                              {product.unitPrice.toFixed(2)}
                            </td>

                            <td
                              className="
                            px-3
                            py-2.5
                            text-center
                            text-[#66736B]
                          "
                            >
                              {product.disc}%
                            </td>

                            <td
                              className="
                            px-3
                            py-2.5
                            text-right
                            font-medium
                          "
                            >
                              {total.toFixed(2)}
                            </td>

                            <td
                              className="
                            px-3
                            py-2.5
                            text-right
                            font-semibold
                            text-[#10673E]
                          "
                            >
                              {discountedTotal.toFixed(2)}
                            </td>

                            <td
                              className="
                            px-3
                            py-2.5
                            text-center
                          "
                            >
                              {product.spCode || "-"}
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
                                onClick={() => handleDeleteClick(product.id)}
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              /* TABLE SUMMARY */
            }

            <div
              className="
            grid
            shrink-0
            grid-cols-4
            border-t
            border-[#DDE5DF]
            bg-[#F1F8F3]
          "
            >
              <MiniSummary label="Items" value={totalItems} />

              <MiniSummary label="Quantity" value={totalQty} />

              <MiniSummary label="Gross Total" value={grossTotal.toFixed(2)} />

              <MiniSummary label="SP Items" value={totalSP} />
            </div>

            {/* ACTION BUTTONS */}

            <div
              className="
            flex
            shrink-0
            flex-wrap
            gap-1.5
            border-t
            border-[#DDE5DF]
            bg-white
            p-2
          "
            >
              <ActionButton icon={<Printer size={13} />} text="Ref Slip" />

              <ActionButton icon={<FileText size={13} />} text="Reprint" />

              <ActionButton
                icon={<Gift size={13} />}
                text="Gift Bill"
              />

              <ActionButton
                icon={<ArrowLeftRight size={13} />}
                text="Exchange"
              />

              <ActionButton
                icon={<Play size={13} />}
                text="Resume"
                onClick={() => setIsResumeModalOpen(true)}
              />

              <ActionButton icon={<Pause size={13} />} text={isPausing ? "Pausing..." : "Pause"} 
        onClick={handlePauseSale}
        disabled={isPausing} />

              <ActionButton
                icon={<Save size={13} />}
                text={isSaving ? "Saving..." : "Save [F2]"}
                primary
                onClick={handleSaveSale}
                disabled={isSaving}
              />

              {saveNotice && (
                <span
                  className={`inline-flex items-center rounded-md border px-2.5 py-1.5 text-sm font-medium ${
                    saveNotice.type === "success"
                      ? "border-[#B7E2C7] bg-[#E8F5ED] text-[#10673E]"
                      : "border-[#F3C2C2] bg-[#FCECEC] text-[#B84A4A]"
                  }`}
                >
                  {saveNotice.message}
                </span>
              )}
            </div>
          </section>

      </div>

      </div>

      <aside
          className="
            ml-2.5
            flex
            w-[300px]
            shrink-0
            flex-col
            overflow-hidden
            rounded-xl
            border
            border-[#DDE5DF]
            bg-white
            shadow-sm
          "
        >
          {/* TOTAL PAYABLE */}
          <div
            className="
            shrink-0
            rounded-t-xl
            bg-[#10673E]
            px-3
            py-2.5
            text-white
            shadow-md
          "
          >
            <div
              className="
              flex
              items-center
              justify-between
              text-[11px]
              font-semibold
              uppercase
              tracking-wide
              text-white/60
            "
            >
              <span>TOTAL PAYABLE</span>
              <span>BDT</span>
            </div>
            <div
              className="
              mt-0.5
              text-right
              text-xl
              font-bold
              tracking-tight
            "
            >
              {netPayable.toFixed(2)}
            </div>
          </div>

          {/* PAYMENT HEADER */}

          {/* <div
            className="
            flex
            h-9
            shrink-0
            items-center
            gap-2
            border-b
            border-[#DDE5DF]
            bg-[#F1F8F3]
            px-3
          "
          >
            <CreditCard size={14} className="text-[#10673E]" />

            <span
              className="
              text-sm
              font-semibold
              text-[#10673E]
            "
            >
              Payment
            </span>
          </div> */}

          <div
            className="
            p-3 space-y-3
          "
          >
            {/* SUMMARY */}

            <div
              className="
              divide-y
              divide-[#ECEFEA]
              rounded-lg
              border
              border-[#E3E7E0]
              bg-[#FAFBF9]
            "
            >
              <PaymentSummaryRow
                label="Total Price"
                value={grossTotal}
                strong
              />
              <PaymentSummaryRow
                label="Discounted Price"
                value={netPayableBeforeVat}
                strong
              />

              <PaymentSummaryRow
                label="Discount Amount"
                value={productDiscount + invoiceDiscountAmount}
                strong
              />

              <PaymentSummaryRow label="Total VAT" value={totalVat} strong />

              {/* Refund Type & CS No */}
              <div className="px-3 py-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#66736B]">
                      Refund Type
                    </label>
                    <select
                      value={refundType}
                      onChange={(e) => setRefundType(e.target.value)}
                      className="h-8 w-full rounded-md border border-[#DDE5DF] bg-white px-2 text-sm outline-none focus:border-[#0E9351]"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Slip">Slip</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#66736B]">
                      CS No
                    </label>
                    <input
                      type="text"
                      disabled={refundType !== "Slip"}
                      value={changeRefNo}
                      onChange={(e) => setChangeRefNo(e.target.value)}
                      className="h-8 w-full rounded-md border border-[#DDE5DF] bg-white px-2 text-sm outline-none focus:border-[#0E9351] disabled:cursor-not-allowed disabled:bg-[#F3F4F2] disabled:text-gray-400"
                      placeholder={refundType === "Slip" ? "CS No" : "Select Slip first"}
                    />
                  </div>
                </div>
              </div>

              <PaymentSummaryRow
                label="Total Received"
                value={totalReceived}
                labelClassName="text-[#0136ff]"
                valueClassName="text-[#0136ff]"
              />

              <PaymentSummaryRow
                label="Change"
                value={change}
                labelClassName="text-[#a90419]"
                valueClassName="text-[#a90419]"
              />

              <PaymentSummaryRow
                label="Due"
                value={due}
                labelClassName="text-[#fb0200]"
                valueClassName="text-[#fb0200]"
              />
            </div>

            {/* EXTRA FIELDS */}

            <div
              className="
              space-y-2.5
            "
            >
              {/* <CompactField label="Adjustment">
                <input
                  type="number"
                  value={adjustment}
                  onChange={(e) => setAdjustment(Number(e.target.value))}
                  className={smallInputClass}
                />
              </CompactField> */}

              <CompactField label="Remarks">
                <input
                  type="text"
                  className={smallInputClass}
                  placeholder="Optional"
                />
              </CompactField>

              <CompactField label="Cash">
                <input
                  type="number"
                  value={cashReceived === 0 ? "" : cashReceived}
                  onChange={(e) =>
                    setCashReceived(
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  className="
                    h-9
                    w-full
                    rounded-md
                    border
                    border-[#B8C4B4]
                    bg-[#F1F8F3]
                    px-2.5
                    text-right
                    text-sm
                    font-semibold
                    text-[#10673E]
                    outline-none
                    focus:border-[#0E9351]
                    focus:ring-2
                    focus:ring-[#0E9351]/15
                  "
                />
              </CompactField>
            </div>

            {/* PAYMENT METHODS */}

            <div>
              <p
                className="
                mb-2.5
                text-xs
                font-semibold
                uppercase
                tracking-wide
                text-[#66736B]
              "
              >
                Payment Method
              </p>

              <div
                className="
                grid
                grid-cols-3
                gap-2
              "
              >
                <PaymentButton
                  icon={<CreditCard size={14} />}
                  text="Card"
                  onClick={() => setIsCardPaymentModalOpen(true)}
                />

                <PaymentButton
                  icon={<Smartphone size={14} />}
                  text="MFS"
                  onClick={() => setIsMfsPaymentModalOpen(true)}
                />

                <PaymentButton
                  icon={<Receipt size={14} />}
                  text="Slip"
                  onClick={() => setIsSlipPaymentModalOpen(true)}
                />

                <PaymentButton
                  icon={<Ticket size={14} />}
                  text="Voucher"
                  onClick={() => setIsVoucherPaymentModalOpen(true)}
                />

                <label className="
                  flex
                  h-9
                  items-center
                  justify-center
                  gap-1.5
                  rounded-md
                  border
                  border-[#DDE5DF]
                  bg-[#F1F8F3]
                  px-1
                  text-sm
                  font-medium
                  text-[#10673E]
                  cursor-pointer
                  transition
                  hover:border-[#0E9351]
                  hover:bg-[#E8F5ED]
                "
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-[#0E9351]"
                  />
                  <Gift size={14} />
                  Gift
                </label>
              </div>
            </div>
          </div>

          {/* COMPLETE SALE */}

          {/* <div
            className="
            mt-auto
            shrink-0
            border-t
            border-[#DDE5DF]
            bg-white
            p-2.5
          "
          >
            <button
              type="button"
              className="
                flex
                h-11
                w-full
                items-center
                justify-center
                gap-2
                rounded-md
                bg-[#0E9351]
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
              Complete Sale
            </button>
          </div> */}
        </aside>

      {/* ================================================= */}
      {/* MODALS */}
      {/* ================================================= */}

      <CardPaymentModal
      key={mfsModalResetKey}
        open={isCardPaymentModalOpen}
        onClose={() => setIsCardPaymentModalOpen(false)}
        onCardEntriesChange={setCardEntries}
        channelOptions={cardChannelOptions}
        posMachineOptions={posMachineOptions}
      />

      <MfsPaymentModal
      key={mfsModalResetKey}
        open={isMfsPaymentModalOpen}
        onClose={() => setIsMfsPaymentModalOpen(false)}
        onMfsEntriesChange={setMfsEntries}
        channelOptions={mfsChannelOptions}
      />

      <SlipPaymentModal
      key={mfsModalResetKey}
        open={isSlipPaymentModalOpen}
        onClose={() => setIsSlipPaymentModalOpen(false)}
        onSlipEntriesChange={setSlipEntries}
        channelOptions={slipChannelOptions}
      />

      <VoucherPaymentModal
      key={mfsModalResetKey}
        open={isVoucherPaymentModalOpen}
        onClose={() => setIsVoucherPaymentModalOpen(false)}
        onVoucherEntriesChange={setVoucherEntries}
        channelOptions={voucherChannelOptions}
      />

      <PaymentModal
      key={mfsModalResetKey}
        open={isWalletOpen}
        title="Wallet Payment"
        amount={walletAmount}
        setAmount={setWalletAmount}
        onClose={() => setIsWalletOpen(false)}
      />

      <CustomerInfoModal
      key={mfsModalResetKey}
        open={isCustomerInfoOpen}
        onClose={() => setIsCustomerInfoOpen(false)}
        customer={customerInfo}
      />

      <ResumeInvoiceModal
        open={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onLoad={handleResumeLoad}
      />

      <ChangeDueModal
        open={changeModal !== null}
        amount={changeModal?.amount ?? 0}
        changeType={changeModal?.type ?? "Cash"}
        changeRefNo={changeModal?.refNo ?? ""}
        onClose={() => setChangeModal(null)}
      />

      {billData && (
        <BillReceipt
          saleData={billData.sale}
          items={billData.items}
          cashierName={user?.displayName || user?.username || "Cashier"}
          storeInfo={{ ...DEFAULT_STORE_INFO, logoUrl: logo }}
          autoPrint
          onClose={() => setBillData(null)}
        />
      )}

      {/* ================================================= */}
      {/* DELETE AUTHORIZATION MODAL */}
      {/* ================================================= */}

      {deleteAuthOpen && (
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
        >
          <div
            className="
            w-full
            max-w-sm
            overflow-hidden
            rounded-xl
            border
            border-[#DDE5DF]
            bg-white
            shadow-2xl
          "
          >
            <div
              className="
              flex
              items-center
              justify-between
              border-b
              border-[#E6EAE3]
              px-5
              py-4
            "
            >
              <div>
                <p
                  className="
                  text-sm
                  font-semibold
                  uppercase
                  tracking-wider
                  text-[#66736B]
                "
                >
                  Authorization Required
                </p>

                <h2
                  className="
                  mt-0.5
                  text-lg
                  font-semibold
                  text-[#17231D]
                "
                >
                  Delete Product
                </h2>
              </div>

              <button
                type="button"
                onClick={handleDeleteCancel}
                className="
                  rounded-md
                  p-1.5
                  text-[#66736B]
                  transition
                  hover:bg-[#F1F8F3]
                  hover:text-[#10673E]
                "
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-5">
              <label
                className="
                mb-2
                block
                text-sm
                font-medium
                text-[#66736B]
              "
              >
                Enter password to confirm deletion
              </label>

              <input
                autoFocus
                type="password"
                value={deletePassword}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDeleteConfirm();
                }}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError(false);
                }}
                className="
                  h-11
                  w-full
                  rounded-md
                  border
                  border-[#DDE5DF]
                  px-3
                  text-lg
                  font-semibold
                  text-[#17231D]
                  outline-none
                  focus:border-[#0E9351]
                  focus:ring-2
                  focus:ring-[#0E9351]/15
                "
              />

              {deleteError && (
                <p
                  className="
                  mt-2
                  text-sm
                  font-medium
                  text-[#B84A4A]
                "
                >
                  Incorrect password. Please try again.
                </p>
              )}

              <div
                className="
                mt-5
                flex
                justify-end
                gap-2
              "
              >
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="
                    inline-flex
                    h-9
                    items-center
                    justify-center
                    gap-1.5
                    rounded-md
                    bg-[#B84A4A]
                    px-4
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-[#963838]
                    active:scale-[0.98]
                  "
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================================================
// CHANGE DUE MODAL
// ======================================================

interface ChangeDueModalProps {
  open: boolean;
  amount: number;
  changeType: string;
  changeRefNo: string;
  onClose: () => void;
}

function ChangeDueModal({
  open,
  amount,
  changeType,
  changeRefNo,
  onClose,
}: ChangeDueModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-[#DDE5DF] bg-white shadow-2xl">
        <div className="bg-[#10673E] px-5 py-4 text-white">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/70">
            Sale Completed
          </p>
          <h2 className="mt-0.5 text-lg font-semibold">Change Due</h2>
        </div>

        <div className="px-5 py-6 text-center">
          <p className="text-sm font-medium text-[#66736B]">
            Return to customer
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-[#10673E]">
            ৳{amount.toFixed(2)}
          </p>
          <p className="mt-3 text-sm text-[#66736B]">
            Type:{" "}
            <span className="font-semibold text-[#17231D]">{changeType}</span>
            {changeRefNo ? (
              <>
                {" \u00b7 "}CS No:{" "}
                <span className="font-semibold text-[#17231D]">
                  {changeRefNo}
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex justify-end border-t border-[#DDE5DF] bg-white px-5 py-4">
          <button type="button" onClick={onClose} className={primaryButtonClass}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// FIELD
// ======================================================

interface FieldProps {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}

function Field({ label, icon, children }: FieldProps) {
  return (
    <div>
      <label
        className="
        mb-1
        flex
        items-center
        gap-1
        text-sm
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
// COMPACT FIELD
// ======================================================

interface CompactFieldProps {
  label: string;
  children: ReactNode;
}

function CompactField({ label, children }: CompactFieldProps) {
  return (
    <div
      className="
      grid
      grid-cols-[95px_1fr]
      items-center
      gap-2
    "
    >
      <span
        className="
        text-sm
        font-medium
        text-[#66736B]
      "
      >
        {label}
      </span>

      {children}
    </div>
  );
}

// ======================================================
// MINI SUMMARY
// ======================================================

interface MiniSummaryProps {
  label: string;
  value: string | number;
}

function MiniSummary({ label, value }: MiniSummaryProps) {
  return (
    <div
      className="
      flex
      items-center
      justify-between
      border-r
      border-[#E3E7E0]
      px-3
      py-1.5
      last:border-r-0
    "
    >
      <span
        className="
        text-sm
        font-medium
        uppercase
        tracking-wide
        text-[#8A938B]
      "
      >
        {label}
      </span>

      <span
        className="
        text-sm
        font-semibold
        text-[#10673E]
      "
      >
        {value}
      </span>
    </div>
  );
}

// ======================================================
// PAYMENT SUMMARY ROW
// ======================================================

interface PaymentSummaryRowProps {
  label: string;
  value: number;
  strong?: boolean;
  positive?: boolean;
  labelClassName?: string;
  valueClassName?: string;
  danger?: boolean;
}

function PaymentSummaryRow({
  label,
  value,
  strong = false,
  positive = false,
  danger = false,
  valueClassName = "",
  labelClassName = "",
}: PaymentSummaryRowProps) {
  return (
    <div
      className="
      flex
      items-center
      justify-between
      px-3
      py-1.5
    "
    >
      <span
        className={`
        text-sm
         ${strong ? "font-semibold" : "font-normal"}
        ${labelClassName || "text-[#66736B]"}
        `}
      >
        {label}
      </span>

      <span
        className={`
          text-sm
          ${strong ? "font-semibold" : "font-medium"}
         ${
           valueClassName
             ? valueClassName
             : positive
               ? "text-[#0E9351]"
               : danger
                 ? "text-[#B84A4A]"
                 : "text-[#17231D]"
         }
          ${valueClassName}
        `}
      >
        {value.toFixed(2)}
      </span>
    </div>
  );
}

// ======================================================
// ACTION BUTTON
// ======================================================

interface ActionButtonProps {
  icon: ReactNode;
  text: string;
  primary?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

function ActionButton({
  icon,
  text,
  primary = false,
  onClick,
  disabled = false,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${primary ? primaryButtonClass : secondaryButtonClass}
        ${disabled ? "cursor-not-allowed opacity-60" : ""}
      `}
    >
      {icon}

      {text}
    </button>
  );
}

// ======================================================
// PAYMENT BUTTON
// ======================================================

interface PaymentButtonProps {
  icon: ReactNode;
  text: string;
  onClick: () => void;
}

function PaymentButton({ icon, text, onClick }: PaymentButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex
        h-9
        items-center
        justify-center
        gap-1
        rounded-md
        border
        border-[#DDE5DF]
        bg-[#F1F8F3]
        px-1
        text-sm
        font-medium
        text-[#10673E]
        transition
        hover:border-[#0E9351]
        hover:bg-[#E8F5ED]
        active:scale-[0.98]
      "
    >
      {icon}

      {text}
    </button>
  );
}

export default SaleEntry;
