export interface MasterProduct {
  id: number;
  barcode: string;
  prodName: string;
  group: string;
  type: string;
  category: string | null;
  style: string | null;
  brandName: string;
  size: string;
  color: string | null;
  unitPrice: number;
  disc: number;
  vat: number;
  productDescription: string;
}
export interface SlipCheckResponse {
  id: number;
  slipNumber: string;
  status: boolean;
  expiredDate: Date;
  slipAmount: number;

}
export interface VoucherCheckResponse {
  id: number;
  voucherNumber: string;
  status: boolean;
  expiredDate: Date;
  voucherAmount: number;

}

export interface ProductApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  warnings: string[];
  errors: string[] | null;
  meta: {
    timestamp: string;
    totalCount: number;
    page: number;
    limit: number;
  };
  data: MasterProduct[];
}