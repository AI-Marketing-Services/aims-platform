import type { Metadata } from "next"
import ROICalculatorClient from "./ROICalculatorClient"

export const metadata: Metadata = {
  title: "ROI Calculator | AIMS",
  description:
    "Calculate your potential ROI from AI-powered business operations. Get a personalized savings report.",
}

export default function ROICalculatorPage() {
  return <ROICalculatorClient />
}
