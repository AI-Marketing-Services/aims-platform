import type { Metadata } from "next"
import StackConfiguratorClient from "./StackConfiguratorClient"

export const metadata: Metadata = {
  title: "AI Stack Configurator | AI Operator Collective",
  description:
    "Build your ideal AI technology stack. Get personalized recommendations based on your business needs.",
}

export default function StackConfiguratorPage() {
  return <StackConfiguratorClient />
}
