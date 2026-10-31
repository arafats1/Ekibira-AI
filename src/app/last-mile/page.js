import { redirect } from "next/navigation";

// The last-mile console is now part of the admin dashboard.
export default function LastMilePage() {
  redirect("/admin?tab=outlook");
}
