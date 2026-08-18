import {
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FolderTree,
  Gem,
  LayoutGrid,
  LoaderCircle,
  Merge,
  Ruler,
  Tags,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  useCallback,
  useState,
  type ReactNode,
} from "react";


// ======================================================
// TYPES
// ======================================================

interface MergeAttribute {
  key: "group" | "type" | "category" | "brand" | "size";
  label: string;
  title: string;
  icon: LucideIcon;
  subtext: string;
  options: string[];
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

const mergeAttributes: MergeAttribute[] = [
  {
    key: "group",
    label: "Group",
    title: "Merge Groups",
    icon: LayoutGrid,
    subtext: "Consolidate duplicate product groups into a single record.",
    options: [
      "Apparel",
      "Accessories",
      "Footwear",
      "Apparel (Old)",
      "Fashion",
      "Garments",
    ],
  },
  {
    key: "type",
    label: "Type",
    title: "Merge Types",
    icon: Tags,
    subtext: "Combine duplicate product types that mean the same thing.",
    options: [
      "Shirt",
      "Pants",
      "Shoes",
      "T-Shirt",
      "Tee",
      "Trouser",
    ],
  },
  {
    key: "category",
    label: "Category",
    title: "Merge Categories",
    icon: FolderTree,
    subtext: "Merge similar categories so products stay easy to browse.",
    options: [
      "Casual",
      "Formal",
      "Casual Wear",
      "Winter",
      "Sports",
      "Everyday",
    ],
  },
  {
    key: "brand",
    label: "Brand",
    title: "Merge Brands",
    icon: Gem,
    subtext: "Unify duplicate or legacy brand records across the catalog.",
    options: [
      "Local Brand",
      "Heritage",
      "Elegance",
      "Local Brand Co.",
      "Winterline",
      "Active Gear",
    ],
  },
  {
    key: "size",
    label: "Size",
    title: "Merge Sizes",
    icon: Ruler,
    subtext: "Consolidate size labels that refer to the same fitting.",
    options: [
      "M",
      "L",
      "XL",
      "Medium",
      "Large",
      "One Size",
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
  hint?: string;
  children: ReactNode;
}

function Field({
  label,
  hint,
  children,
}: FieldProps) {

  return (
    <div className="min-w-0">

      <label className="
        mb-1
        flex
        items-center
        justify-between
        gap-2
      ">

        <span className="
          text-[10px]
          font-semibold
          text-[#66736B]
        ">
          {label}
        </span>

        {hint && (
          <span className="
            text-[9px]
            text-[#9AA29C]
          ">
            {hint}
          </span>
        )}

      </label>

      {children}

    </div>
  );
}


// ======================================================
// MERGE MODAL
// ======================================================

interface MergeModalProps {
  config: MergeAttribute;
  onClose: () => void;
  onConfirm: (
    config: MergeAttribute,
    source: string,
    target: string
  ) => void;
}

function MergeModal({
  config,
  onClose,
  onConfirm,
}: MergeModalProps) {

  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sameRecord =
    source !== "" &&
    target !== "" &&
    source === target;

  const canConfirm =
    source !== "" &&
    target !== "" &&
    !sameRecord &&
    !isLoading;

  const handleConfirm = () => {

    if (!canConfirm) {
      return;
    }

    setIsLoading(true);

    window.setTimeout(() => {
      setIsLoading(false);
      onConfirm(config, source, target);
    }, 1200);
  };

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
        animation: "pm-fade 150ms ease-out",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >

      <div
        className="
          w-full
          max-w-lg
          overflow-hidden
          rounded-xl
          border
          border-[#DDE5DF]
          bg-white
          shadow-2xl
        "
        style={{
          animation: "pm-pop 180ms ease-out",
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
              <Merge size={14} />
            </div>

            <div>

              <h2 className="
                text-sm
                font-semibold
                text-[#17231D]
              ">
                {config.title}
              </h2>

              <p className="
                text-[9px]
                text-[#66736B]
              ">
                Combine duplicate or legacy records
                into a single active record
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
          space-y-3
          p-4
        ">

          {/* Source / Target dropdowns */}

          <div className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
          ">

            <Field
              label={`Source ${config.label}`}
              hint="To be removed"
            >

              <div className="relative">

                <select
                  value={source}
                  onChange={(e) =>
                    setSource(e.target.value)
                  }
                  className={`
                    ${smallInputClass}
                    appearance-none
                    pr-8
                    ${source ? "" : "text-[#9AA29C]"}
                  `}
                >
                  <option value="" disabled>
                    Select record
                  </option>

                  {config.options.map((option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ))}

                </select>

                <ChevronRight
                  size={14}
                  className="
                    pointer-events-none
                    absolute
                    right-2.5
                    top-1/2
                    -translate-y-1/2
                    rotate-90
                    text-[#8A938B]
                  "
                />

              </div>

            </Field>

            <Field
              label={`Target ${config.label}`}
              hint="Keeps all items"
            >

              <div className="relative">

                <select
                  value={target}
                  onChange={(e) =>
                    setTarget(e.target.value)
                  }
                  className={`
                    ${smallInputClass}
                    appearance-none
                    pr-8
                    ${target ? "" : "text-[#9AA29C]"}
                  `}
                >
                  <option value="" disabled>
                    Select record
                  </option>

                  {config.options.map((option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  ))}

                </select>

                <ChevronRight
                  size={14}
                  className="
                    pointer-events-none
                    absolute
                    right-2.5
                    top-1/2
                    -translate-y-1/2
                    rotate-90
                    text-[#8A938B]
                  "
                />

              </div>

            </Field>

          </div>

          {sameRecord && (
            <p className="
              text-[10px]
              font-medium
              text-[#B84A4A]
            ">
              Source and Target must be different records.
            </p>
          )}

          {/* Warning banner */}

          <div className="
            flex
            items-start
            gap-2
            rounded-md
            border
            border-[#F5E3A8]
            bg-[#FEF9E7]
            px-3
            py-2.5
          ">

            <TriangleAlert
              size={15}
              className="
                mt-0.5
                shrink-0
                text-[#B7791F]
              "
            />

            <p className="
              text-[10px]
              leading-relaxed
              text-[#8A6D1F]
            ">
              All products linked to the Source record will
              be permanently reassigned to the Target record.
            </p>

          </div>

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
            disabled={isLoading}
            className={`
              ${secondaryButtonClass}
              disabled:cursor-not-allowed
              disabled:opacity-50
            `}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`
              inline-flex
              h-9
              items-center
              justify-center
              gap-1.5
              rounded-md
              px-4
              text-xs
              font-semibold
              transition
              active:scale-[0.98]
              ${
                canConfirm
                  ? "bg-[#0E9351] text-white shadow-sm hover:bg-[#10673E]"
                  : "cursor-not-allowed bg-[#E3E7E0] text-[#9AA29C]"
              }
            `}
          >
            {isLoading ? (
              <>
                <LoaderCircle
                  size={14}
                  className="animate-spin"
                />
                Merging…
              </>
            ) : (
              <>
                <Merge size={13} />
                Confirm &amp; Merge
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  );
}


// ======================================================
// PRODUCT MANAGEMENT (MAIN)
// ======================================================

function ProductManagement() {

  // ====================================================
  // UI STATE
  // ====================================================

  const [activeMerge, setActiveMerge] =
    useState<MergeAttribute | null>(null);

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
  // MERGE CONFIRM
  // ====================================================

  const handleMergeConfirm = (
    config: MergeAttribute,
    source: string,
    target: string
  ) => {

    setActiveMerge(null);

    showToast(
      `${config.label} merged — "${source}" → "${target}"`,
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
        @keyframes pm-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pm-pop {
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
            <Boxes size={16} />
          </div>

          <div>

            <h1 className="
              text-sm
              font-semibold
              leading-none
              text-[#17231D]
            ">
              Product Management
            </h1>

            <p className="
              mt-0.5
              text-[9px]
              text-[#66736B]
            ">
              Select an attribute below to consolidate
              duplicate product records
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
          <Merge size={11} />
          {mergeAttributes.length} merge tools
        </span>

      </header>


      {/* ================================================= */}
      {/* SCROLLABLE CONTENT */}
      {/* ================================================= */}

      <div className="
        min-h-0
        flex-1
        overflow-auto
        px-[clamp(8px,1vw,16px)]
        py-3
      ">

        <section className="
          w-full
          rounded-xl
          border
          border-[#DDE5DF]
          bg-white
          p-4
          shadow-[0_1px_3px_rgba(35,42,35,0.05)]
        ">

          {/* SECTION HEADER */}

          <div className="
            mb-4
            flex
            flex-wrap
            items-center
            justify-between
            gap-2
          ">

            <div className="
              flex
              items-center
              gap-2
            ">

              <span className="
                flex
                h-6
                w-6
                items-center
                justify-center
                rounded-md
                bg-[#E8F5ED]
                text-[#10673E]
              ">
                <Merge size={13} />
              </span>

              <h2 className="
                text-xs
                font-semibold
                text-[#17231D]
              ">
                Merge &amp; Consolidate
              </h2>

            </div>

            <span className="
              text-[10px]
              text-[#9AA29C]
            ">
              Click a card to open its merge tool
            </span>

          </div>


          {/* ACTION CARDS GRID */}

          <div className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-5
          ">

            {mergeAttributes.map((attribute) => {

              const Icon = attribute.icon;

              return (

                <button
                  key={attribute.key}
                  type="button"
                  onClick={() =>
                    setActiveMerge(attribute)
                  }
                  className="
                    group
                    relative
                    flex
                    flex-col
                    rounded-xl
                    border
                    border-[#DDE5DF]
                    bg-white
                    p-4
                    text-left
                    shadow-[0_1px_3px_rgba(35,42,35,0.04)]
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                    hover:border-[#0E9351]/40
                    hover:shadow-[0_10px_24px_rgba(16,103,62,0.12)]
                    active:scale-[0.99]
                  "
                >

                  <div className="
                    flex
                    items-center
                    justify-between
                  ">

                    <span className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      bg-[#E8F5ED]
                      text-[#10673E]
                      transition-colors
                      duration-200
                      group-hover:bg-[#10673E]
                      group-hover:text-white
                    ">
                      <Icon size={16} />
                    </span>

                    <ChevronRight
                      size={14}
                      className="
                        text-[#C5CCC6]
                        transition-all
                        duration-200
                        group-hover:translate-x-0.5
                        group-hover:text-[#0E9351]
                      "
                    />

                  </div>

                  <p className="
                    mt-3
                    text-sm
                    font-semibold
                    text-[#17231D]
                  ">
                    {attribute.title}
                  </p>

                  <p className="
                    mt-1
                    flex-1
                    text-[10px]
                    leading-relaxed
                    text-[#66736B]
                  ">
                    {attribute.subtext}
                  </p>

                  <div className="
                    mt-3
                    flex
                    items-center
                    justify-between
                    border-t
                    border-[#ECEFEA]
                    pt-2.5
                  ">

                    <span className="
                      rounded-full
                      bg-[#F1F8F3]
                      px-2
                      py-0.5
                      text-[9px]
                      font-semibold
                      text-[#66736B]
                    ">
                      {attribute.options.length} records
                    </span>

                    <span className="
                      text-[10px]
                      font-semibold
                      text-[#0E9351]
                      opacity-0
                      transition-opacity
                      duration-200
                      group-hover:opacity-100
                    ">
                      Merge →
                    </span>

                  </div>

                </button>
              );
            })}

          </div>

        </section>

      </div>


      {/* ================================================= */}
      {/* MERGE MODAL */}
      {/* ================================================= */}

      {activeMerge && (
        <MergeModal
          config={activeMerge}
          onClose={() =>
            setActiveMerge(null)
          }
          onConfirm={handleMergeConfirm}
        />
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

export default ProductManagement;
