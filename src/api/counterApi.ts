import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** One POS counter row — mirrors the backend POSCounter read model. */
export interface POSCounter {
  counterId: number;
  branchId: number;
  branchName: string | null;
  counterName: string;
  counterCode: string;
  ipAddress: string;
  macAddress: string;
}

export interface POSCounterListResponse {
  success: boolean;
  message: string;
  data: POSCounter[];
}

export interface POSCounterMutationResponse {
  success: boolean;
  message: string;
  data: unknown;
}

/* ------------------------------------------------------------------ */
/* List                                                                */
/* ------------------------------------------------------------------ */

/*
 * The list endpoint has been seen returning several shapes:
 *   - POSCounter[]                          (bare array)
 *   - { success, message, data: POSCounter[] }
 *   - { success, message, data: { items: [...] } }  (paged wrapper)
 * Normalize to always expose a flat POSCounter[] in data.
 */
interface RawListResponse {
  success?: boolean;
  message?: string;
  data?: POSCounter[] | { items?: POSCounter[] } | null;
}

/** Map one raw row to the POSCounter read model (tolerant of field drift). */
const mapCounter = (row: Record<string, unknown>): POSCounter => ({
  counterId: Number(row.counterId ?? row.id ?? 0),
  branchId: Number(row.branchId ?? 0),
  branchName: (row.branchName as string | null) ?? null,
  counterName: (row.counterName as string) ?? "",
  counterCode: (row.counterCode as string) ?? "",
  ipAddress: (row.ipAddress as string) ?? "",
  macAddress: (row.macAddress as string) ?? "",
});

/** GET /api/POSCounters — all POS counters. */
export const getPOSCounters = async (): Promise<POSCounterListResponse> => {
  const response = await api.get<unknown>("POSCounters");
  const body = response.data;

  let rows: unknown[] = [];
  let success = true;
  let message = "";

  if (Array.isArray(body)) {
    rows = body;
  } else if (body && typeof body === "object") {
    const wrapper = body as RawListResponse;
    success = wrapper.success ?? true;
    message = wrapper.message ?? "";

    const raw = wrapper.data;
    if (Array.isArray(raw)) {
      rows = raw;
    } else if (raw && typeof raw === "object" && Array.isArray(raw.items)) {
      rows = raw.items;
    }
  }

  return {
    success,
    message,
    data: rows.map((row) => mapCounter(row as Record<string, unknown>)),
  };
};

/* ------------------------------------------------------------------ */
/* Create                                                              */
/* ------------------------------------------------------------------ */

/** Body of POST /api/POSCounters (backend create DTO). */
export interface POSCounterCreateDto {
  branchId: number;
  counterCode: string;
  counterName: string;
  ipAddress: string;
  macAddress: string;
}

/**
 * Body of PUT /api/POSCounters/{id} (backend update DTO).
 * NOTE: branchId is intentionally absent — the update contract does
 * not change a counter's branch.
 */
export interface POSCounterUpdateDto {
  counterCode: string;
  counterName: string;
  ipAddress: string;
  macAddress: string;
}

/** POST /api/POSCounters — create a new POS counter. */
export const createPOSCounter = async (
  dto: POSCounterCreateDto
): Promise<POSCounterMutationResponse> => {
  const response = await api.post<POSCounterMutationResponse>(
    "POSCounters",
    dto
  );
  const body = response.data;

  return {
    success: body?.success ?? true,
    message: body?.message ?? "",
    data: body?.data ?? null,
  };
};

/** PUT /api/POSCounters/{counterId} — update an existing POS counter. */
export const updatePOSCounter = async (
  counterId: number,
  dto: POSCounterUpdateDto
): Promise<POSCounterMutationResponse> => {
  const response = await api.put<POSCounterMutationResponse>(
    `POSCounters/${counterId}`,
    dto
  );
  const body = response.data;

  return {
    success: body?.success ?? true,
    message: body?.message ?? "",
    data: body?.data ?? null,
  };
};
