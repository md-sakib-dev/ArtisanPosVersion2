import {useMemo} from 'react';
import {
  AllCommunityModule,
  themeBalham,
  type ColDef,
} from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import products from "../../data/products.json";
import type { Product } from "../../types/product";
const ProductReport = () => {
  const columnDefs = useMemo<ColDef<Product>[]>(
    () => [
      {
        field: "productName",
        headerName: "Product Name",
        minWidth: 180,
        flex: 1.5,
        filter: "agTextColumnFilter",
        floatingFilter: true,
      },
      {
        field: "barcode",
        headerName: "Barcode",
        minWidth: 130,
        filter: "agTextColumnFilter",
        floatingFilter: true,
      },
      {
        field: "group",
        headerName: "Group",
        minWidth: 100,
        filter: "agTextColumnFilter",
        floatingFilter: true,
      },
      {
        field: "type",
        headerName: "Type",
        minWidth: 130,
        filter: "agTextColumnFilter",
        floatingFilter: true,
      },
      {
        field: "category",
        headerName: "Category",
        minWidth: 110,
        filter: "agTextColumnFilter",
        floatingFilter: true,
      },
      {
        field: "style",
        headerName: "Style",
        minWidth: 130,
        filter: "agTextColumnFilter",
        floatingFilter: true,
      },
      {
        field: "brandName",
        headerName: "Brand Name",
        minWidth: 120,
        filter: "agTextColumnFilter",
        floatingFilter: true,
      },
      {
        field: "size",
        headerName: "Size",
        minWidth: 100,
        filter: "agTextColumnFilter",
        floatingFilter: true,
      },
      {
        field: "color",
        headerName: "Color",
        minWidth: 100,
        filter: "agTextColumnFilter",
        floatingFilter: true,
      },
      {
        field: "price",
        headerName: "Price",
        minWidth: 100,
        filter: "agNumberColumnFilter",
        floatingFilter: true,
        type: "numericColumn",
        valueFormatter: (params) =>
          params.value != null
            ? Number(params.value).toLocaleString()
            : "",
      },
      {
        field: "vat",
        headerName: "Vat%",
        minWidth: 90,
        filter: "agNumberColumnFilter",
        floatingFilter: true,
        type: "numericColumn",
        valueFormatter: (params) =>
          params.value != null ? `${params.value}` : "",
      },
      {
        field: "productDescription",
        headerName: "Product Description",
        minWidth: 350,
        flex: 2,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        wrapText: true,
        autoHeight: true,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<Product>>(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
    }),
    []
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#F5F2EA] p-4 text-sm">

      {/* Report Header */}
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-semibold text-[#354536]">
          Product Report
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Search, filter and sort product information
        </p>
      </div>

      {/* Report Card */}
      <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-white p-3 shadow-sm">

        {/* Card Header */}
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Product List
            </h2>

            <p className="text-sm text-gray-500">
              {products.length} products
            </p>
          </div>
        </div>

        {/* AG Grid */}
        <div className="min-h-0 flex-1">
          <AgGridProvider modules={[AllCommunityModule]}>
            <AgGridReact<Product>
              className="product-report-grid"
              theme={themeBalham}
              rowData={products as Product[]}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows={true}
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
            />
          </AgGridProvider>
        </div>

      </div>
    </div>
  );
};

export default ProductReport;