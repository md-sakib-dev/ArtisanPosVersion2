import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** One payment type record — mirrors the backend TransactionChannelOption. */
export interface TransactionChannelOption {
  channelOptionId: number;
  channelId: number;
  channelName: string;
  optionCode: string;
  optionName: string;
}

/**
 * Body of POST /api/TransactionChannelOptions — a SINGLE object.
 * (Backend: WsTechpos.Application.DTOs.TransactionChannelOptionCreateDto —
 * confirmed by the 400 "The dto field is required" error when an array
 * was sent.) channelOptionId = 0 creates a new record; the existing ID
 * updates it.
 */
export interface TransactionChannelOptionCreateDto {
  channelOptionId: number;
  channelId: number;
  channelName: string;
  optionCode: string;
  optionName: string;
}

export interface TransactionChannelOptionListResponse {
  success: boolean;
  message: string;
  data: TransactionChannelOption[];
}

export interface TransactionChannelOptionMutationResponse {
  success: boolean;
  message: string;
  data: unknown;
}

/* ------------------------------------------------------------------ */
/* List                                                                */
/* ------------------------------------------------------------------ */

/*
 * The list endpoint has been seen returning several shapes:
 *   - TransactionChannelOption[]                          (bare array)
 *   - { success, message, data: TransactionChannelOption[] }
 *   - { success, message, data: { items: [...] } }        (paged wrapper)
 * Normalize to always expose a flat TransactionChannelOption[] in data.
 */
interface RawListResponse {
  success?: boolean;
  message?: string;
  data?:
    | TransactionChannelOption[]
    | { items?: TransactionChannelOption[] }
    | null;
}

/** GET /api/TransactionChannelOptions — all payment types. */
export const getTransactionChannelOptions =
  async (): Promise<TransactionChannelOptionListResponse> => {
    const response = await api.get<unknown>("TransactionChannelOptions");
    const body = response.data;

    let list: TransactionChannelOption[] = [];
    let success = true;
    let message = "";

    if (Array.isArray(body)) {
      list = body as TransactionChannelOption[];
    } else if (body && typeof body === "object") {
      const wrapper = body as RawListResponse;
      success = wrapper.success ?? true;
      message = wrapper.message ?? "";

      const raw = wrapper.data;
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && typeof raw === "object" && Array.isArray(raw.items)) {
        list = raw.items;
      }
    }

    return { success, message, data: list };
  };

/* ------------------------------------------------------------------ */
/* Dropdown: transaction channels                                      */
/* ------------------------------------------------------------------ */

/** One option of a GET /api/Dropdown/* endpoint (value is sent back as string). */
export interface DropdownOption {
  value: string;
  text: string;
}

interface DropdownResponse {
  success: boolean;
  message: string;
  data: DropdownOption[];
}

/**
 * GET /api/Dropdown/transaction-channels — value = channel ID,
 * text = channel name. Used by the Payment Type form's
 * Transaction Channel dropdown.
 */
export const getTransactionChannelDropdown =
  async (): Promise<DropdownOption[]> => {
    const response = await api.get<DropdownResponse>(
      "Dropdown/transaction-channels"
    );
    return response.data?.data ?? [];
  };

/* ------------------------------------------------------------------ */
/* Create / update                                                     */
/* ------------------------------------------------------------------ */

/**
 * Save a payment type: POST /api/TransactionChannelOptions.
 *
 * IMPORTANT: the endpoint takes a SINGLE TransactionChannelOptionCreateDto
 * object — NOT an array (an array body returns 400 "The dto field is
 * required"). channelOptionId = 0 creates a new record; passing an
 * existing channelOptionId updates it. channelId must come from the
 * Transaction Channel dropdown, and channelName from the same
 * dropdown's data.
 */
export const createTransactionChannelOption = async (
  dto: TransactionChannelOptionCreateDto
): Promise<TransactionChannelOptionMutationResponse> => {
  const response = await api.post<TransactionChannelOptionMutationResponse>(
    "TransactionChannelOptions",
    dto
  );
  const body = response.data;

  return {
    success: body?.success ?? true,
    message: body?.message ?? "",
    data: body?.data ?? null,
  };
};
