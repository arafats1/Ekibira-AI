/** Shared account-type → dashboard routing for KibiraAI */

export const DASHBOARD_ROUTES = {
  farmer: "/dashboard/farmer",
  forestry: "/dashboard/forestry",
  school_health: "/dashboard/school",
  local_gov: "/dashboard/school", // legacy → schools & health dashboard
  // Legacy types still route somewhere sensible
  insurance: "/dashboard/insurance",
  general: "/dashboard/forestry",
  eu_compliance: "/dashboard/forestry",
};

export function getDashboardRoute(accountType) {
  return DASHBOARD_ROUTES[accountType] || "/dashboard";
}

export const USE_CASE_LINKS = [
  {
    href: "/signup?type=farmer",
    label: "Farmer",
    description: "Climate-smart farming tools and crop guidance",
    accent: "bg-amber-500",
  },
  {
    href: "/signup?type=forestry",
    label: "Forestry & conservation",
    description: "Forest Sentinel monitoring and conservation intel",
    accent: "bg-emerald-500",
  },
  {
    href: "/signup?type=school_health",
    label: "Schools & health facilities",
    description: "Child climate–health early warning for schools and clinics",
    accent: "bg-rose-500",
  },
];
