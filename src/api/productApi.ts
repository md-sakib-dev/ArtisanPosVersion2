import api from "./axios";
// import type {MasterProduct,ProductApiResponse} from "../types/product";
import type { MasterProduct} from "../types/product";

export const getProductByBarcode = async (
  barcode: string
): Promise<MasterProduct | null> => {
  const response = await api.get<MasterProduct[]>("/products/products", {
    params: {
      barcode,
    },
  });

  console.log("API response:", response.data);

  if (response.data.length === 0) {
    return null;
  }

  return response.data[0];
};