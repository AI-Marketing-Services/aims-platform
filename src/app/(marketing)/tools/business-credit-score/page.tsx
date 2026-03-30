import type { Metadata } from "next"
import BusinessCreditScoreClient from "./BusinessCreditScoreClient"

export const metadata: Metadata = {
  title: "Business Credit Score | AIMS",
  description:
    "Find out your business credit score in 2 minutes. Get a personalized scorecard showing exactly what's helping and hurting your business credit — free.",
}

export default function BusinessCreditScorePage() {
  return <BusinessCreditScoreClient />
}
