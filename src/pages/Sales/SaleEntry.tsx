import {
  Scan,
  Package,
  Hash,
  Plus,
  Phone,
  Settings,
  Percent,
  BadgeDollarSign,
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
  Wallet,
  Trash2,
  Maximize2,
  Minimize2,
  X,
  ShoppingCart,
  UserRound,
} from "lucide-react";

import {
  useState,
  type ReactNode,
} from "react";


// ======================================================
// TYPES
// ======================================================

interface MasterProduct {
  id: number;
  barcode: string;
  prodName: string;
  unitPrice: number;
  disc: number;
  vat: number;
}

interface CartProduct extends MasterProduct {
  qty: number;
  spCode: string;
}


// ======================================================
// SAMPLE PRODUCTS
// ======================================================

const masterProducts: MasterProduct[] = [
  {
    id: 1,
    barcode: "123456789123456",
    prodName: "Sample Product",
    unitPrice: 200,
    disc: 5,
    vat: 7.5,
  },
  {
    id: 2,
    barcode: "789012",
    prodName: "Product Two",
    unitPrice: 150,
    disc: 0,
    vat: 7.5,
  },
  {
    id: 3,
    barcode: "345678",
    prodName: "Product Three",
    unitPrice: 500,
    disc: 0,
    vat: 7.5,
  },
  {
    id: 4,
    barcode: "123455",
    prodName: "Sample Product 2",
    unitPrice: 200,
    disc: 10,
    vat: 7.5,
  },
];


// ======================================================
// REUSABLE STYLES
// ======================================================

const inputClass = `
  h-9
  w-full
  rounded-md
  border
  border-[#D5DBD2]
  bg-white
  px-3
  text-sm
  text-[#263027]
  outline-none
  transition
  placeholder:text-[#9AA29C]
  focus:border-[#596B4F]
  focus:ring-2
  focus:ring-[#596B4F]/10
`;

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
  focus:border-[#596B4F]
  focus:ring-2
  focus:ring-[#596B4F]/10
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
    <div className="
      fixed
      inset-0
      z-50
      flex
      items-center
      justify-center
      bg-black/40
      p-4
      backdrop-blur-[2px]
    ">

      <div className="
        w-full
        max-w-md
        overflow-hidden
        rounded-xl
        border
        border-[#D9DED5]
        bg-white
        shadow-2xl
      ">

        <div className="
          flex
          items-center
          justify-between
          border-b
          border-[#E6EAE3]
          px-5
          py-4
        ">

          <div>
            <p className="
              text-[10px]
              font-semibold
              uppercase
              tracking-wider
              text-[#7A847C]
            ">
              Payment
            </p>

            <h2 className="
              mt-0.5
              text-lg
              font-semibold
              text-[#263027]
            ">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-md
              p-1.5
              text-[#687269]
              transition
              hover:bg-[#F1F4EF]
              hover:text-[#354536]
            "
          >
            <X size={19} />
          </button>

        </div>


        <div className="p-5">

          <label className="
            mb-2
            block
            text-xs
            font-medium
            text-[#5F6861]
          ">
            Amount
          </label>

          <input
            autoFocus
            type="number"
            value={amount}
            onChange={(e) =>
              setAmount(
                Number(e.target.value)
              )
            }
            className="
              h-11
              w-full
              rounded-md
              border
              border-[#D5DBD2]
              px-3
              text-lg
              font-semibold
              text-[#263027]
              outline-none
              focus:border-[#596B4F]
              focus:ring-2
              focus:ring-[#596B4F]/10
            "
          />

          <div className="
            mt-5
            flex
            justify-end
            gap-2
          ">

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
// SALE ENTRY
// ======================================================

function SaleEntry() {

  // ====================================================
  // PRODUCT INPUT
  // ====================================================

  const [barcodeInput, setBarcodeInput] =
    useState("");

  const [spCodeInput, setSpCodeInput] =
    useState("");

  const [qtyInput, setQtyInput] =
    useState<number>(1);

  const [isSpEnabled, setIsSpEnabled] =
    useState(false);


  // ====================================================
  // CUSTOMER
  // ====================================================

  const [phoneNumber, setPhoneNumber] =
    useState("");


  // ====================================================
  // DISCOUNT
  // ====================================================

  const [invoiceDiscount, setInvoiceDiscount] =
    useState<number>(0);

  const [adjustment, setAdjustment] =
    useState<number>(0);


  // ====================================================
  // CART
  // ====================================================

  const [products, setProducts] =
    useState<CartProduct[]>([]);


  // ====================================================
  // PAYMENTS
  // ====================================================

  const [cashReceived, setCashReceived] =
    useState<number>(0);

  const [cardAmount, setCardAmount] =
    useState<number>(0);

  const [mfsAmount, setMfsAmount] =
    useState<number>(0);

  const [slipAmount, setSlipAmount] =
    useState<number>(0);

  const [voucherAmount, setVoucherAmount] =
    useState<number>(0);

  const [walletAmount, setWalletAmount] =
    useState<number>(0);


  // ====================================================
  // PAYMENT MODALS
  // ====================================================

  const [isCardOpen, setIsCardOpen] =
    useState(false);

  const [isMfsOpen, setIsMfsOpen] =
    useState(false);

  const [isSlipOpen, setIsSlipOpen] =
    useState(false);

  const [isVoucherOpen, setIsVoucherOpen] =
    useState(false);

  const [isWalletOpen, setIsWalletOpen] =
    useState(false);


  // ====================================================
  // FULLSCREEN
  // ====================================================

  const [isFullScreen, setIsFullScreen] =
    useState(false);


  // ====================================================
  // ADD PRODUCT
  // ====================================================

  const handleAddProduct = () => {

    const foundProduct =
      masterProducts.find(
        (product) =>
          product.barcode ===
          barcodeInput.trim()
      );

    if (!foundProduct) {
      alert("Product not found");
      return;
    }

    const quantity = Number(qtyInput);

    if (quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    setProducts((previousProducts) => {

      const existingIndex =
        previousProducts.findIndex(
          (product) =>
            product.barcode ===
            foundProduct.barcode
        );

      if (existingIndex !== -1) {

        const updatedProducts = [
          ...previousProducts,
        ];

        const existingProduct =
          updatedProducts[existingIndex];

        updatedProducts[existingIndex] = {
          ...existingProduct,
          qty:
            existingProduct.qty +
            quantity,
          spCode:
            spCodeInput ||
            existingProduct.spCode,
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
  };


  // ====================================================
  // DELETE PRODUCT
  // ====================================================

  const handleDeleteProduct = (
    id: number
  ) => {

    setProducts((previousProducts) =>
      previousProducts.filter(
        (product) =>
          product.id !== id
      )
    );
  };


  // ====================================================
  // CALCULATIONS
  // ====================================================

  const hasProductDiscount =
    products.some(
      (product) =>
        product.disc > 0
    );

  const grossTotal =
    products.reduce(
      (total, product) =>
        total +
        product.qty *
        product.unitPrice,
      0
    );

  const productDiscount =
    products.reduce(
      (total, product) =>
        total +
        (
          product.qty *
          product.unitPrice *
          product.disc
        ) / 100,
      0
    );

  const productTotal =
    grossTotal -
    productDiscount;

  const invoiceDiscountAmount =
    hasProductDiscount
      ? 0
      : (
          productTotal *
          invoiceDiscount
        ) / 100;

  const totalVat =
    products.reduce(
      (total, product) => {

        const discountedPrice =
          product.unitPrice -
          (
            product.unitPrice *
            product.disc
          ) / 100;

        return (
          total +
          (
            discountedPrice *
            product.qty *
            product.vat
          ) / 100
        );
      },
      0
    );

  const netPayableBeforeVat =
    productTotal -
    invoiceDiscountAmount;

  const netPayable =
    netPayableBeforeVat +
    totalVat;

  const totalQty =
    products.reduce(
      (total, product) =>
        total + product.qty,
      0
    );

  const totalItems =
    products.length;

  const totalSP =
    products.reduce(
      (total, product) =>
        total +
        (product.spCode ? 1 : 0),
      0
    );


  // ====================================================
  // PAYMENTS
  // ====================================================

  const totalReceived =
    Number(cashReceived) +
    Number(cardAmount) +
    Number(mfsAmount) +
    Number(slipAmount) +
    Number(voucherAmount) +
    Number(walletAmount);

  const change =
    totalReceived > netPayable
      ? totalReceived -
        netPayable -
        Number(adjustment)
      : 0;

  const due =
    totalReceived < netPayable
      ? netPayable -
        totalReceived -
        Number(adjustment)
      : 0;


  // ====================================================
  // FULLSCREEN
  // ====================================================

  const toggleFullScreen =
    async () => {

      try {

        if (!document.fullscreenElement) {

          await document.documentElement
            .requestFullscreen();

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

    <div className="
      flex
      h-full
      w-full
      flex-col
      overflow-hidden
      bg-[#F4F1E8]
      p-2
      text-[#263027]
    ">


      {/* ================================================= */}
      {/* POS HEADER */}
      {/* ================================================= */}

      <header className="
        flex
        h-11
        shrink-0
        items-center
        justify-between
        border-b
        border-[#D9DED5]
        bg-[#354536]
        px-3
        text-white
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
            bg-white/10
          ">
            <ShoppingCart size={16} />
          </div>

          <div>
            <p className="
              text-sm
              font-semibold
              leading-none
            ">
              Sales Entry
            </p>

            <p className="
              mt-0.5
              text-[9px]
              text-white/60
            ">
              Point of Sale
            </p>
          </div>

        </div>


        <div className="
          flex
          items-center
          gap-5
          text-[10px]
          text-white/70
        ">

          <span>
            Counter: <b className="text-white">01</b>
          </span>

          <span>
            User: <b className="text-white">Cashier</b>
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
            {isFullScreen ? (
              <Minimize2 size={15} />
            ) : (
              <Maximize2 size={15} />
            )}
          </button>

        </div>

      </header>


      {/* ================================================= */}
      {/* TOP INPUT AREA */}
      {/* ================================================= */}

      <section className="
        mt-2
        shrink-0
        border
        border-[#D9DED5]
        bg-white
        p-2.5
      ">

        <div className="
          grid
          grid-cols-1
          gap-3
          xl:grid-cols-[1fr_1.4fr]
        ">


          {/* PRODUCT INPUT */}

          <div className="
            grid
            grid-cols-3
            gap-2
          ">

            <Field
              label="Barcode"
              icon={<Scan size={13} />}
            >

              <div className="
                flex
                gap-1.5
              ">

                <input
                  value={barcodeInput}
                  onChange={(e) =>
                    setBarcodeInput(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {

                    if (
                      e.key === "Enter"
                    ) {
                      handleAddProduct();
                    }

                  }}
                  className={smallInputClass}
                  placeholder="Scan barcode"
                />

                <label className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-md
                  border
                  border-[#D5DBD2]
                  bg-[#F8FAF6]
                ">

                  <input
                    type="checkbox"
                    checked={isSpEnabled}
                    onChange={(e) =>
                      setIsSpEnabled(
                        e.target.checked
                      )
                    }
                    className="
                      h-3.5
                      w-3.5
                      accent-[#354536]
                    "
                  />

                </label>

              </div>

            </Field>


            <Field
              label="SP Code"
              icon={<Package size={13} />}
            >

              <input
                value={spCodeInput}
                disabled={!isSpEnabled}
                onChange={(e) =>
                  setSpCodeInput(
                    e.target.value
                  )
                }
                className="
                  h-8
                  w-full
                  rounded-md
                  border
                  border-[#D5DBD2]
                  bg-white
                  px-2.5
                  text-xs
                  outline-none
                  focus:border-[#596B4F]
                  disabled:cursor-not-allowed
                  disabled:bg-[#F3F4F2]
                  disabled:text-gray-400
                "
                placeholder="SP code"
              />

            </Field>


            <Field
              label="Quantity"
              icon={<Hash size={13} />}
            >

              <div className="
                flex
                gap-1.5
              ">

                <input
                  type="number"
                  min={1}
                  value={qtyInput}
                  onChange={(e) =>
                    setQtyInput(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="
                    h-8
                    min-w-0
                    flex-1
                    rounded-md
                    border
                    border-[#D5DBD2]
                    px-2
                    text-center
                    text-xs
                    outline-none
                    focus:border-[#596B4F]
                  "
                />

                <button
                  type="button"
                  onClick={
                    handleAddProduct
                  }
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-md
                    bg-[#354536]
                    text-white
                    transition
                    hover:bg-[#4E6048]
                  "
                >
                  <Plus size={16} />
                </button>

              </div>

            </Field>

          </div>


          {/* CUSTOMER / DISCOUNT */}

          <div className="
            grid
            grid-cols-4
            gap-2
            lg:grid-cols-5
          ">

            <Field
              label="Customer Phone"
              icon={<Phone size={13} />}
            >

              <input
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(
                    e.target.value
                  )
                }
                className={smallInputClass}
                placeholder="Phone number"
              />

            </Field>


            <Field
              label="Adjustment"
              icon={<Settings size={13} />}
            >

              <input
                type="number"
                value={adjustment}
                onChange={(e) =>
                  setAdjustment(
                    Number(
                      e.target.value
                    )
                  )
                }
                className={smallInputClass}
              />

            </Field>


            <Field
              label="Invoice Discount"
              icon={<Percent size={13} />}
            >

              <select
                value={invoiceDiscount}
                onChange={(e) =>
                  setInvoiceDiscount(
                    Number(
                      e.target.value
                    )
                  )
                }
                disabled={hasProductDiscount}
                className="
                  h-8
                  w-full
                  rounded-md
                  border
                  border-[#D5DBD2]
                  bg-white
                  px-2
                  text-xs
                  outline-none
                  focus:border-[#596B4F]
                  disabled:bg-[#F3F4F2]
                "
              >

                <option value={0}>
                  No Discount
                </option>

                <option value={5}>
                  5%
                </option>

                <option value={10}>
                  10%
                </option>

                <option value={15}>
                  15%
                </option>

                <option value={20}>
                  20%
                </option>

              </select>

            </Field>


            <Field
              label="Discount Amount"
              icon={
                <BadgeDollarSign
                  size={13}
                />
              }
            >

              <input
                readOnly
                value={
                  invoiceDiscountAmount.toFixed(
                    2
                  )
                }
                className="
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
                  text-[#354536]
                "
              />

            </Field>


            <div className="
              hidden
              items-end
              lg:flex
            ">

              <button
                type="button"
                onClick={
                  toggleFullScreen
                }
                className="
                  flex
                  h-8
                  w-full
                  items-center
                  justify-center
                  gap-1.5
                  rounded-md
                  border
                  border-[#D5DBD2]
                  bg-white
                  text-[10px]
                  font-medium
                  text-[#354536]
                  transition
                  hover:bg-[#F3F6F0]
                "
              >

                {isFullScreen ? (
                  <Minimize2 size={13} />
                ) : (
                  <Maximize2 size={13} />
                )}

                {isFullScreen
                  ? "Exit Fullscreen"
                  : "Fullscreen"}

              </button>

            </div>

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* MAIN AREA */}
      {/* ================================================= */}

      <div className="
        mt-2
        flex
        min-h-0
        flex-1
        gap-2
        overflow-hidden
      ">


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
          border
          border-[#D9DED5]
          bg-white
        ">

          <div className="
            flex
            h-9
            shrink-0
            items-center
            justify-between
            border-b
            border-[#D9DED5]
            bg-[#F8FAF6]
            px-3
          ">

            <div className="
              flex
              items-center
              gap-2
            ">

              <ShoppingCart
                size={14}
                className="text-[#354536]"
              />

              <span className="
                text-xs
                font-semibold
                text-[#354536]
              ">
                Sale Items
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
                {totalItems}
              </span>

            </div>

            <span className="
              text-[10px]
              text-[#7A847C]
            ">
              {totalQty} units
            </span>

          </div>


          <div className="
            min-h-0
            flex-1
            overflow-auto
          ">

            <table className="
              w-full
              min-w-[850px]
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
                    text-left
                    text-[10px]
                    font-semibold
                  ">
                    Barcode
                  </th>

                  <th className="
                    px-3
                    py-2.5
                    text-left
                    text-[10px]
                    font-semibold
                  ">
                    Product
                  </th>

                  <th className="
                    px-3
                    py-2.5
                    text-center
                    text-[10px]
                    font-semibold
                  ">
                    Qty
                  </th>

                  <th className="
                    px-3
                    py-2.5
                    text-right
                    text-[10px]
                    font-semibold
                  ">
                    Unit Price
                  </th>

                  <th className="
                    px-3
                    py-2.5
                    text-center
                    text-[10px]
                    font-semibold
                  ">
                    Disc%
                  </th>

                  <th className="
                    px-3
                    py-2.5
                    text-right
                    text-[10px]
                    font-semibold
                  ">
                    Total
                  </th>

                  <th className="
                    px-3
                    py-2.5
                    text-right
                    text-[10px]
                    font-semibold
                  ">
                    Net Price
                  </th>

                  <th className="
                    px-3
                    py-2.5
                    text-center
                    text-[10px]
                    font-semibold
                  ">
                    SP
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

                {products.length === 0 ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="
                        py-16
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

                        <ShoppingCart
                          size={30}
                          strokeWidth={1.5}
                        />

                        <p className="
                          mt-2
                          text-xs
                          font-medium
                        ">
                          No products added
                        </p>

                        <p className="
                          mt-1
                          text-[10px]
                        ">
                          Scan a barcode to add
                          products
                        </p>

                      </div>

                    </td>

                  </tr>

                ) : (

                  products.map(
                    (product) => {

                      const total =
                        product.qty *
                        product.unitPrice;

                      const discountedTotal =
                        total -
                        (
                          total *
                          product.disc
                        ) / 100;

                      return (

                        <tr
                          key={product.id}
                          className="
                            border-b
                            border-[#ECEFEA]
                            transition-colors
                            hover:bg-[#F6F8F4]
                          "
                        >

                          <td className="
                            px-3
                            py-2.5
                            text-[#667067]
                          ">
                            {product.barcode}
                          </td>

                          <td className="
                            px-3
                            py-2.5
                            font-medium
                            text-[#263027]
                          ">
                            {product.prodName}
                          </td>

                          <td className="
                            px-3
                            py-2.5
                            text-center
                            font-medium
                          ">
                            {product.qty}
                          </td>

                          <td className="
                            px-3
                            py-2.5
                            text-right
                          ">
                            {product.unitPrice.toFixed(2)}
                          </td>

                          <td className="
                            px-3
                            py-2.5
                            text-center
                            text-[#596B4F]
                          ">
                            {product.disc}%
                          </td>

                          <td className="
                            px-3
                            py-2.5
                            text-right
                            font-medium
                          ">
                            {total.toFixed(2)}
                          </td>

                          <td className="
                            px-3
                            py-2.5
                            text-right
                            font-semibold
                            text-[#354536]
                          ">
                            {discountedTotal.toFixed(2)}
                          </td>

                          <td className="
                            px-3
                            py-2.5
                            text-center
                          ">
                            {product.spCode || "-"}
                          </td>

                          <td className="
                            px-3
                            py-2.5
                            text-center
                          ">

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteProduct(
                                  product.id
                                )
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

                              <Trash2
                                size={14}
                              />

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


          {/* TABLE SUMMARY */}

          <div className="
            grid
            shrink-0
            grid-cols-4
            border-t
            border-[#D9DED5]
            bg-[#F8FAF6]
          ">

            <MiniSummary
              label="Items"
              value={totalItems}
            />

            <MiniSummary
              label="Quantity"
              value={totalQty}
            />

            <MiniSummary
              label="Gross Total"
              value={grossTotal.toFixed(2)}
            />

            <MiniSummary
              label="SP Items"
              value={totalSP}
            />

          </div>


          {/* ACTION BUTTONS */}

          <div className="
            flex
            shrink-0
            flex-wrap
            gap-1.5
            border-t
            border-[#D9DED5]
            bg-white
            p-2
          ">

            <ActionButton
              icon={<Printer size={13} />}
              text="Ref Slip"
            />

            <ActionButton
              icon={<FileText size={13} />}
              text="Reprint"
            />

            <ActionButton
              icon={<ArrowLeftRight size={13} />}
              text="Exchange"
            />

            <ActionButton
              icon={<Play size={13} />}
              text="Resume"
            />

            <ActionButton
              icon={<Pause size={13} />}
              text="Pause"
            />

            <ActionButton
              icon={<Save size={13} />}
              text="Save [F2]"
              primary
            />

          </div>

        </section>


        {/* ================================================= */}
        {/* PAYMENT PANEL */}
        {/* ================================================= */}

        <aside className="
          flex
          w-[22%]
          min-w-[285px]
          max-w-[370px]
          shrink-0
          flex-col
          overflow-hidden
          border
          border-[#D9DED5]
          bg-white
        ">


          {/* PAYMENT HEADER */}

          <div className="
            flex
            h-9
            shrink-0
            items-center
            gap-2
            border-b
            border-[#D9DED5]
            bg-[#F8FAF6]
            px-3
          ">

            <CreditCard
              size={14}
              className="text-[#354536]"
            />

            <span className="
              text-xs
              font-semibold
              text-[#354536]
            ">
              Payment
            </span>

          </div>


          <div className="
            min-h-0
            flex-1
            overflow-auto
            p-2.5
          ">


            {/* TOTAL PAYABLE */}

            <div className="
              rounded-lg
              bg-[#354536]
              px-4
              py-3
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
                mt-1
                text-right
                text-3xl
                font-bold
                tracking-tight
              ">
                {netPayable.toFixed(2)}
              </div>

            </div>


            {/* SUMMARY */}

            <div className="
              mt-3
              divide-y
              divide-[#ECEFEA]
              border
              border-[#E3E7E0]
              bg-[#FAFBF9]
            ">

              <PaymentSummaryRow
                label="Discounted Price"
                value={
                  netPayableBeforeVat
                }
              />

              <PaymentSummaryRow
                label="Discount Amount"
                value={
                  productDiscount +
                  invoiceDiscountAmount
                }
              />

              <PaymentSummaryRow
                label="Total VAT"
                value={totalVat}
              />

              <PaymentSummaryRow
                label="Total Received"
                value={totalReceived}
                strong
              />

              <PaymentSummaryRow
                label="Change"
                value={change}
                positive
              />

              <PaymentSummaryRow
                label="Due"
                value={due}
                danger={due > 0}
              />

            </div>


            {/* EXTRA FIELDS */}

            <div className="
              mt-3
              space-y-2
            ">

              <CompactField
                label="Adjustment"
              >

                <input
                  type="number"
                  value={adjustment}
                  onChange={(e) =>
                    setAdjustment(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className={smallInputClass}
                />

              </CompactField>


              <CompactField
                label="Reference"
              >

                <input
                  type="text"
                  className={smallInputClass}
                  placeholder="Optional"
                />

              </CompactField>


              <CompactField
                label="Cash Received"
              >

                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) =>
                    setCashReceived(
                      Number(
                        e.target.value
                      )
                    )
                  }
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
                    text-[#354536]
                    outline-none
                    focus:border-[#596B4F]
                    focus:ring-2
                    focus:ring-[#596B4F]/10
                  "
                />

              </CompactField>

            </div>


            {/* PAYMENT METHODS */}

            <div className="mt-3">

              <p className="
                mb-2
                text-[10px]
                font-semibold
                uppercase
                tracking-wide
                text-[#7A847C]
              ">
                Payment Method
              </p>


              <div className="
                grid
                grid-cols-3
                gap-1.5
              ">

                <PaymentButton
                  icon={
                    <CreditCard size={14} />
                  }
                  text="Card"
                  onClick={() =>
                    setIsCardOpen(true)
                  }
                />

                <PaymentButton
                  icon={
                    <Smartphone size={14} />
                  }
                  text="MFS"
                  onClick={() =>
                    setIsMfsOpen(true)
                  }
                />

                <PaymentButton
                  icon={
                    <Receipt size={14} />
                  }
                  text="Slip"
                  onClick={() =>
                    setIsSlipOpen(true)
                  }
                />

                <PaymentButton
                  icon={
                    <Ticket size={14} />
                  }
                  text="Voucher"
                  onClick={() =>
                    setIsVoucherOpen(true)
                  }
                />

                <PaymentButton
                  icon={
                    <Wallet size={14} />
                  }
                  text="Wallet"
                  onClick={() =>
                    setIsWalletOpen(true)
                  }
                />

              </div>

            </div>

          </div>


          {/* COMPLETE SALE */}

          <div className="
            shrink-0
            border-t
            border-[#D9DED5]
            bg-white
            p-2.5
          ">

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
                bg-[#354536]
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-[#4E6048]
                active:scale-[0.99]
              "
            >

              <Save size={16} />

              Complete Sale

            </button>

          </div>

        </aside>

      </div>


      {/* ================================================= */}
      {/* MODALS */}
      {/* ================================================= */}

      <PaymentModal
        open={isCardOpen}
        title="Card Payment"
        amount={cardAmount}
        setAmount={setCardAmount}
        onClose={() =>
          setIsCardOpen(false)
        }
      />

      <PaymentModal
        open={isMfsOpen}
        title="MFS Payment"
        amount={mfsAmount}
        setAmount={setMfsAmount}
        onClose={() =>
          setIsMfsOpen(false)
        }
      />

      <PaymentModal
        open={isSlipOpen}
        title="Slip Payment"
        amount={slipAmount}
        setAmount={setSlipAmount}
        onClose={() =>
          setIsSlipOpen(false)
        }
      />

      <PaymentModal
        open={isVoucherOpen}
        title="Voucher Payment"
        amount={voucherAmount}
        setAmount={setVoucherAmount}
        onClose={() =>
          setIsVoucherOpen(false)
        }
      />

      <PaymentModal
        open={isWalletOpen}
        title="Wallet Payment"
        amount={walletAmount}
        setAmount={setWalletAmount}
        onClose={() =>
          setIsWalletOpen(false)
        }
      />

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
// COMPACT FIELD
// ======================================================

interface CompactFieldProps {
  label: string;
  children: ReactNode;
}

function CompactField({
  label,
  children,
}: CompactFieldProps) {

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
// MINI SUMMARY
// ======================================================

interface MiniSummaryProps {
  label: string;
  value: string | number;
}

function MiniSummary({
  label,
  value,
}: MiniSummaryProps) {

  return (

    <div className="
      flex
      items-center
      justify-between
      border-r
      border-[#E3E7E0]
      px-3
      py-1.5
      last:border-r-0
    ">

      <span className="
        text-[9px]
        font-medium
        uppercase
        tracking-wide
        text-[#8A938B]
      ">
        {label}
      </span>

      <span className="
        text-[11px]
        font-semibold
        text-[#354536]
      ">
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
  danger?: boolean;
}

function PaymentSummaryRow({
  label,
  value,
  strong = false,
  positive = false,
  danger = false,
}: PaymentSummaryRowProps) {

  return (

    <div className="
      flex
      items-center
      justify-between
      px-3
      py-2
    ">

      <span className="
        text-[10px]
        text-[#687269]
      ">
        {label}
      </span>

      <span
        className={`
          text-xs
          ${strong ? "font-semibold" : "font-medium"}
          ${
            positive
              ? "text-[#47734D]"
              : ""
          }
          ${
            danger
              ? "text-[#B84A4A]"
              : ""
          }
          ${
            !positive && !danger
              ? "text-[#263027]"
              : ""
          }
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
}

function ActionButton({
  icon,
  text,
  primary = false,
}: ActionButtonProps) {

  return (

    <button
      type="button"
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
// PAYMENT BUTTON
// ======================================================

interface PaymentButtonProps {
  icon: ReactNode;
  text: string;
  onClick: () => void;
}

function PaymentButton({
  icon,
  text,
  onClick,
}: PaymentButtonProps) {

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
        border-[#D5DBD2]
        bg-[#F8FAF6]
        px-1
        text-[10px]
        font-medium
        text-[#354536]
        transition
        hover:border-[#596B4F]
        hover:bg-[#E8EDE3]
        active:scale-[0.98]
      "
    >

      {icon}

      {text}

    </button>
  );
}


export default SaleEntry;