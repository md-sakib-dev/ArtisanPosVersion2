export interface SalesPersonTarget {
  id: string;
  name: string;
  outlet: string;
  monthlyTarget: number;
  achieved: number;
  lastMonthTarget: number;
  lastMonthAchieved: number;
  avatar: string; // initials
  color: string;
}

/* ------------------------------------------------------------------ */
/* Mock sales persons with targets                                      */
/* ------------------------------------------------------------------ */

export const SALES_PERSONS: SalesPersonTarget[] = [
  {
    id: "sp1",
    name: "Farhan Ahmed",
    outlet: "Dhanmondi Flagship",
    monthlyTarget: 450000,
    achieved: 387500,
    lastMonthTarget: 420000,
    lastMonthAchieved: 398000,
    avatar: "FA",
    color: "#10673E",
  },
  {
    id: "sp2",
    name: "Nusrat Jahan",
    outlet: "Gulshan 2 Store",
    monthlyTarget: 400000,
    achieved: 412800,
    lastMonthTarget: 380000,
    lastMonthAchieved: 356000,
    avatar: "NJ",
    color: "#2D5597",
  },
  {
    id: "sp3",
    name: "Rafiqul Islam",
    outlet: "Chittagong EPZ",
    monthlyTarget: 350000,
    achieved: 298400,
    lastMonthTarget: 340000,
    lastMonthAchieved: 310000,
    avatar: "RI",
    color: "#3AAFA9",
  },
  {
    id: "sp4",
    name: "Tanvir Hasan",
    outlet: "Uttara Branch",
    monthlyTarget: 380000,
    achieved: 342600,
    lastMonthTarget: 360000,
    lastMonthAchieved: 345000,
    avatar: "TH",
    color: "#50B4D8",
  },
  {
    id: "sp5",
    name: "Sadia Rahman",
    outlet: "Sylhet City Center",
    monthlyTarget: 280000,
    achieved: 267200,
    lastMonthTarget: 270000,
    lastMonthAchieved: 252000,
    avatar: "SR",
    color: "#E2BA48",
  },
  {
    id: "sp6",
    name: "Mahbub Alam",
    outlet: "Khulna Outlet",
    monthlyTarget: 250000,
    achieved: 198500,
    lastMonthTarget: 240000,
    lastMonthAchieved: 218000,
    avatar: "MA",
    color: "#E2136E",
  },
  {
    id: "sp7",
    name: "Tasnim Ara",
    outlet: "Dhanmondi Flagship",
    monthlyTarget: 320000,
    achieved: 305600,
    lastMonthTarget: 300000,
    lastMonthAchieved: 288000,
    avatar: "TA",
    color: "#F6921E",
  },
  {
    id: "sp8",
    name: "Imran Hossain",
    outlet: "Gulshan 2 Store",
    monthlyTarget: 360000,
    achieved: 378200,
    lastMonthTarget: 350000,
    lastMonthAchieved: 332000,
    avatar: "IH",
    color: "#1E293B",
  },
];
