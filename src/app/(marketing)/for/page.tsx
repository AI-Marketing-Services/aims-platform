import { redirect } from "next/navigation"

// /for requires a partner slug — redirect to the referral page or homepage
export default function ForPage() {
  redirect("/get-started")
}
