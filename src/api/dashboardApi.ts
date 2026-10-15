import api from "./axios";

/* ------------------------------------------------------------------ */
/* Types — mirror the backend DTOs (swagger: DashboardReadDto)         */
/* ------------------------------------------------------------------ */

/** DashboardReadDto.userInfoDto */
export interface UserInfoDto {
  userName: string | null;
  designation: string | null;
  contact: string | null;
}

/** DashboardReadDto.branchInfoDto */
export interface BranchInfoDto {
  branchName: string | null;
  address: string | null;
  vatReg: string | null;
}

/** DashboardReadDto.todaySales / weekSales / monthSales */
export interface SalesSummaryDto {
  amount: number;
  previousAmount: number;
  percentageChange: number;
}

/** DashboardReadDto.weeklySalesTrend[] */
export interface WeeklySalesTrendDto {
  date: string | null;
  label: string | null;
  amount: number;
}

/** DashboardReadDto.inventorySummaryDto */
export interface InventorySummaryDto {
  totalValue: number;
  totalQuantity: number;
}

/** DashboardReadDto */
export interface DashboardData {
  userInfoDto: UserInfoDto | null;
  branchInfoDto: BranchInfoDto | null;
  todaySales: SalesSummaryDto | null;
  weekSales: SalesSummaryDto | null;
  monthSales: SalesSummaryDto | null;
  weeklySalesTrend: WeeklySalesTrendDto[] | null;
  inventorySummaryDto: InventorySummaryDto | null;
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData | null;
}

/* ------------------------------------------------------------------ */
/* Read                                                                */
/* ------------------------------------------------------------------ */

interface RawDashboardResponse {
  success?: boolean;
  message?: string;
  data?: DashboardData | null;
}

/** Numbers arrive as JSON numbers, but guard against strings/nulls. */
const num = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

const mapSales = (raw: unknown): SalesSummaryDto | null => {
  if (!raw || typeof raw !== "object") return null;

  const row = raw as Record<string, unknown>;

  return {
    amount: num(row.amount),
    previousAmount: num(row.previousAmount),
    percentageChange: num(row.percentageChange),
  };
};

const mapTrend = (raw: unknown): WeeklySalesTrendDto[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
    .map((row) => ({
      date: (row.date as string) ?? null,
      label: (row.label as string) ?? null,
      amount: num(row.amount),
    }));
};

/** Normalize the payload so the page always gets the same object shape. */
const mapDashboard = (raw: unknown): DashboardData | null => {
  if (!raw || typeof raw !== "object") return null;

  const body = raw as Record<string, unknown>;
  const user = (body.userInfoDto ?? null) as UserInfoDto | null;
  const branch = (body.branchInfoDto ?? null) as BranchInfoDto | null;
  const inventory = (body.inventorySummaryDto ?? null) as InventorySummaryDto | null;

  return {
    userInfoDto: user,
    branchInfoDto: branch,
    todaySales: mapSales(body.todaySales),
    weekSales: mapSales(body.weekSales),
    monthSales: mapSales(body.monthSales),
    weeklySalesTrend: mapTrend(body.weeklySalesTrend),
    inventorySummaryDto: inventory
      ? {
          totalValue: num(inventory.totalValue),
          totalQuantity: num(inventory.totalQuantity),
        }
      : null,
  };
};

/**
 * GET /api/Dashboards — the POS dashboard in one call: user info, branch
 * info, today/week/month sales summaries, the weekly sales trend and the
 * inventory summary.
 */
export const getDashboard = async (): Promise<DashboardResponse> => {
  const response = await api.get<RawDashboardResponse>("Dashboards");
  const body = response.data;

  return {
    success: body?.success ?? true,
    message: body?.message ?? "",
    data: mapDashboard(body?.data),
  };
};
