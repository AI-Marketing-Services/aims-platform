import { redirect } from "next/navigation"

// /services is surfaced through /marketplace which has the full filterable catalog
export default function ServicesPage() {
  redirect("/marketplace")
}
