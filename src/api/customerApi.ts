import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types (mirror backend CustomerReadDto / CustomerCreateDto /         */
/* CustomerUpdateDto — see Swagger at /swagger/v1/swagger.json)        */
/* ------------------------------------------------------------------ */

export interface Customer {
  customerId: number;
  customerName: string;
  mobileNumber: string;
  emailAddress: string | null;
  presentAddress: string | null;
  birthMonth: number | null;
  birthDay: number | null;
  /** ISO code, e.g. "BD" */
  countryOriginCode: string | null;
  /** Full name resolved by the backend, e.g. "Bangladesh" */
  countryOriginName: string | null;
  gender: string | null;
  discount: number | null;
}

/**
 * POST /api/Customers body — mirrors backend CustomerCreateDto:
 *   customerName, mobileNumber, emailAddress, presentAddress,
 *   countryOrigin, gender, discount, birthMonth, birthDay
 */
export interface CustomerCreateDto {
  customerName: string;
  mobileNumber: string;
  emailAddress: string | null;
  presentAddress: string | null;
  countryOrigin: string | null;
  gender: string | null;
  discount: number | null;
  birthMonth: number | null;
  birthDay: number | null;
}

/** PUT /api/Customers/{id} body (same shape as create) */
export type CustomerUpdateDto = CustomerCreateDto;

/* ------------------------------------------------------------------ */
/* Dropdown: countries                                                 */
/* ------------------------------------------------------------------ */

export interface DropdownOption {
  value: string;
  text: string;
}

interface DropdownResponse {
  success: boolean;
  message: string;
  data: DropdownOption[];
}

/** GET /api/Dropdown/countries — value = country code, text = country name */
export const getCountries = async (): Promise<DropdownOption[]> => {
  const response = await api.get<DropdownResponse>("Dropdown/countries");
  return response.data?.data ?? [];
};

interface PagedResult<T> {
  items: T[];
  pageNumber?: number;
  totalPages?: number;
  totalCount?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export interface CustomerListResponse {
  success: boolean;
  message: string;
  data: PagedResult<Customer>;
  pagination: unknown;
}

export interface CustomerMutationResponse {
  success: boolean;
  message: string;
  data: Customer | null;
}

export interface CustomerQueryParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

/* ------------------------------------------------------------------ */
/* API calls                                                           */
/* ------------------------------------------------------------------ */

/** GET /api/Customers — customer records live in response.data.items */
export const getCustomers = async (
  params: CustomerQueryParams = {}
): Promise<CustomerListResponse> => {
  const response = await api.get<CustomerListResponse>("Customers", { params });
  return response.data;
};

/** POST /api/Customers */
export const createCustomer = async (
  dto: CustomerCreateDto
): Promise<CustomerMutationResponse> => {
  const response = await api.post<CustomerMutationResponse>("Customers", dto);
  return response.data;
};

/** PUT /api/Customers/{id} */
export const updateCustomer = async (
  customerId: number,
  dto: CustomerUpdateDto
): Promise<CustomerMutationResponse> => {
  const response = await api.put<CustomerMutationResponse>(
    `Customers/${customerId}`,
    dto
  );
  return response.data;
};
