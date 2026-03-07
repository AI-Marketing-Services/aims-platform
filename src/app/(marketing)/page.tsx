import { Hero } from "@/components/marketing/Hero"
import { LogoTicker } from "@/components/marketing/LogoTicker"
import { ServicesGrid } from "@/components/marketing/ServicesGrid"
import { HowItWorks } from "@/components/marketing/HowItWorks"
import { Benefits } from "@/components/marketing/Benefits"
import { WhyAIMS } from "@/components/marketing/WhyAIMS"
import { Integrations } from "@/components/marketing/Integrations"
import { Pricing } from "@/components/marketing/Pricing"
import { FAQ } from "@/components/marketing/FAQ"
import { FinalCTA } from "@/components/marketing/FinalCTA"

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoTicker />
      <ServicesGrid />
      <HowItWorks />
      <Benefits />
      <WhyAIMS />
      <Integrations />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  )
}
