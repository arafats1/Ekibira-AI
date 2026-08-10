/**
 * Account-type → dashboard route.
 * Public free tools (urban-warning, advisor, children's EW) are not role dashboards.
 */
export const DASHBOARD_ROUTES = {
  farmer: "/dashboard/farmer",
  forestry: "/dashboard/forestry",
  school_health: "/dashboard/school",
  local_gov: "/dashboard/school", // legacy → schools & health dashboard
  insurance: "/dashboard/insurance", // legacy
  general: "/dashboard/forestry", // legacy
  eu_compliance: "/dashboard/forestry", // legacy
};

export function getDashboardRoute(accountType) {
  return DASHBOARD_ROUTES[accountType] || "/dashboard";
}

export const SIGNUP_ACCOUNT_TYPES = [
  {
    id: "farmer",
    icon: "🌾",
    title: "Farmer",
    navLabel: "Farmer",
    desc: "Track crops against weather patterns, get daily farm actions, predict harvest outcomes, and forecast market prices.",
    color: "border-amber-400 bg-amber-50",
    activeColor: "border-amber-500 bg-amber-100 ring-2 ring-amber-400",
  },
  {
    id: "forestry",
    icon: "🌲",
    title: "Forestry & Conservation",
    navLabel: "Forestry & Conservation",
    desc: "Forest Sentinel access with real-time deforestation monitoring, acoustic alerts, NDVI analysis, and conservation reporting.",
    color: "border-emerald-400 bg-emerald-50",
    activeColor: "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-400",
  },
  {
    id: "school_health",
    icon: "🏫",
    title: "Schools & Health Facilities",
    navLabel: "Schools & Health Facilities",
    desc: "Early warning for heat, flood, air quality and climate-sensitive health risks affecting children, schools, and clinics.",
    color: "border-rose-400 bg-rose-50",
    activeColor: "border-rose-500 bg-rose-100 ring-2 ring-rose-400",
  },
];
