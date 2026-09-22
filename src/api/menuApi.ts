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