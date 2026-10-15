import api from "./axios";
import type {
  MasterProduct,
  RegularSaleBarcodeResponse,
} from "../types/product";

export const getProductByBarcode = async (
  barcode: string
): Promise<MasterProduct | null> => {
  const response = await api.get<RegularSaleBarcodeResponse>(
    `/RegularSales/barcode/${encodeURIComponent(barcode)}`
  );

  console.log("API response:", response.data);

  const payload = response.data;

  if (!payload?.success || !payload.data) {
    return null;
  }

  const p = payload.data;

  return {
    id: p.productId,
    barcode: p.barcode,
    prodName: p.shortName,
    group: "",
    type: "",
    category: null,
    style: null,
    brandName: "",
    size: "",
    color: null,
    unitPrice: p.salesPrice,
    disc: 0,
    vat: p.vatPercent,
    productDescription: p.fullName,
  };
};