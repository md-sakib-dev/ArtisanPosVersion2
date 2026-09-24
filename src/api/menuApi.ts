import api from "./axios";
export interface ApplicationMenu {
  menuId: number;
  systemId: number;
  parentMenuId: number | null;
  menuCode: string;
  menuName: string;
  menuUrl: string;
  icon: string | null;
  displayOrder: number;
  activeSts: number;
  createdAt: string;
  createdBy: number;
}

export interface ApplicationMenuResponse {
  success: boolean;
  message: string;
  data: {
    items: ApplicationMenu[];
  };
  pagination: null;
}

export const getApplicationMenus = async (): Promise<ApplicationMenuResponse> => {
  const response = await api.get<ApplicationMenuResponse>(
    "ApplicationMenus"
  );

  return response.data;
};

/* ------------------------------------------------------------------ */
/* Dropdown: application systems                                        */
/* ------------------------------------------------------------------ */

/**
 * One option of GET /api/Dropdown/application-systems.
 *
 * NOTE: the dropdown returns string system codes (e.g. "POS") while the
 * ApplicationMenus API works with numeric system IDs. The code→ID mapping
 * is resolved from the menu records themselves (each record carries the
 * numeric systemId of its system).
 */
export interface DropdownOption {
  value: string;
  text: string;
}

export interface DropdownResponse {
  success: boolean;
  message: string;
  data: DropdownOption[];
  pagination: null;
}

export const getApplicationSystems = async (): Promise<DropdownResponse> => {
  const response = await api.get<DropdownResponse>(
    "Dropdown/application-systems"
  );

  return response.data;
};

/* ------------------------------------------------------------------ */
/* Application menus by system                                          */
/* ------------------------------------------------------------------ */

/**
 * Raw response of GET /api/ApplicationMenus/by-system/{systemId}.
 * getApplicationMenusBySystem handles both observed shapes:
 *   - plain ApplicationMenu[] array
 *   - { success, message, data: ApplicationMenu[] | { items } , pagination }
 */
export type ApplicationMenusBySystemResponse =
  | ApplicationMenu[]
  | {
      success?: boolean;
      message?: string;
      data: ApplicationMenu[] | { items: ApplicationMenu[] };
      pagination?: null;
    };

const extractMenuList = (
  body: ApplicationMenusBySystemResponse
): ApplicationMenu[] => {
  if (Array.isArray(body)) return body;

  if (body && typeof body === "object" && "data" in body) {
    const data = body.data;

    if (Array.isArray(data)) return data;

    if (data && typeof data === "object" && "items" in data) {
      return data.items ?? [];
    }
  }

  return [];
};

/**
 * Load all menus of one system: GET /api/ApplicationMenus/by-system/{systemId}.
 *
 * systemId must be the numeric system ID used by the backend
 * (see resolveSystemIdFromMenus — the dropdown only returns codes).
 */
export const getApplicationMenusBySystem = async (
  systemId: number | string
): Promise<{ success: boolean; message: string; menus: ApplicationMenu[] }> => {
  const response = await api.get<ApplicationMenusBySystemResponse>(
    `ApplicationMenus/by-system/${systemId}`
  );

  return {
    success: true,
    message: "",
    menus: extractMenuList(response.data),
  };
};

/* ------------------------------------------------------------------ */
/* Create application menu                                              */
/* ------------------------------------------------------------------ */

/** Body of POST /api/ApplicationMenus (backend ApplicationMenuCreateDto). */
export interface ApplicationMenuCreateDto {
  systemId: number;
  parentMenuId: number | null;
  menuCode: string;
  menuName: string;
  menuUrl: string | null;
  icon: string | null;
  displayOrder: number;
}

export interface CreateApplicationMenuResponse {
  success: boolean;
  message: string;
  data: unknown;
  pagination: null;
}

/**
 * Create a new menu: POST /api/ApplicationMenus.
 *
 * systemId must be the numeric system ID (int32) — the selected system's
 * ID resolved from the menu records of that system.
 */
export const createApplicationMenu = async (
  menu: ApplicationMenuCreateDto
): Promise<CreateApplicationMenuResponse> => {
  console.log("Creating menu:", menu);
  const response = await api.post<CreateApplicationMenuResponse>(
    "ApplicationMenus",
    menu
  );

  return response.data;
};

/* ------------------------------------------------------------------ */
/* Update application menu                                              */
/* ------------------------------------------------------------------ */

/**
 * Update an existing menu: PUT /api/ApplicationMenus/{menuId}.
 * Body uses the same shape as create.
 */
export const updateApplicationMenu = async (
  menuId: number,
  menu: ApplicationMenuCreateDto
): Promise<CreateApplicationMenuResponse> => {
  const response = await api.put<CreateApplicationMenuResponse>(
    `ApplicationMenus/${menuId}`,
    menu
  );

  return response.data;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/**
 * Resolve the numeric systemId from the menus of a system.
 *
 * The Dropdown API returns string codes ("POS"), but the menus APIs work
 * with numeric system IDs. Every menu record carries its system's numeric
 * systemId, so the first record identifies the system reliably.
 *
 * Returns null when the system has no menus yet.
 */
export const resolveSystemIdFromMenus = (
  menus: ApplicationMenu[]
): number | null => {
  if (menus.length === 0) return null;
  return menus[0].systemId;
};

/**
 * Root menus of a system: parentMenuId is 0, null or undefined.
 * Child menus (parentMenuId > 0) are excluded — they can never
 * appear as selectable parents.
 */
export const getRootMenus = (
  menus: ApplicationMenu[]
): ApplicationMenu[] => {
  return menus.filter(
    (menu) =>
      menu.parentMenuId === 0 ||
      menu.parentMenuId === null ||
      menu.parentMenuId === undefined
  );
};

/**
 * Build an indented, hierarchy-ordered list for table rendering:
 * each root menu (sorted by displayOrder) immediately followed by
 * its children (sorted by displayOrder).
 */
export const buildMenuTableRows = (
  menus: ApplicationMenu[]
): { menu: ApplicationMenu; isChild: boolean }[] => {
  const roots = getRootMenus(menus).sort(
    (a, b) => a.displayOrder - b.displayOrder || a.menuId - b.menuId
  );

  const rows: { menu: ApplicationMenu; isChild: boolean }[] = [];

  for (const root of roots) {
    rows.push({ menu: root, isChild: false });

    const children = menus
      .filter(
        (menu) =>
          menu.parentMenuId !== null &&
          menu.parentMenuId !== undefined &&
          menu.parentMenuId > 0 &&
          menu.parentMenuId === root.menuId
      )
      .sort(
        (a, b) => a.displayOrder - b.displayOrder || a.menuId - b.menuId
      );

    for (const child of children) {
      rows.push({ menu: child, isChild: true });
    }
  }

  /* Safety net: children whose parent menu is missing from the list */
  const listed = new Set(rows.map((row) => row.menu.menuId));
  for (const menu of menus) {
    if (!listed.has(menu.menuId)) {
      rows.push({ menu, isChild: menu.parentMenuId !== 0 });
    }
  }

  return rows;
};