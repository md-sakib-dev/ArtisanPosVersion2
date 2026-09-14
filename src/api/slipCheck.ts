import api from "./axios";
import type {SlipCheckResponse} from "../types/product";
export const slipCheck = async (
  creditSlipNo: string,amount: number
): Promise<SlipCheckResponse | null> => {
  const response = await api.get<SlipCheckResponse[]>("/products/slip", {
    params: {
    slipNumber: creditSlipNo,
      slipAmount: amount,
    },
  });

  console.log("API response:", response.data);

  if (response.data.length === 0) {
    return null;
  }

  return response.data[0];
};