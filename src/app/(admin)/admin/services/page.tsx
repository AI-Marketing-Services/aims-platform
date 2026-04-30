import { Suspense } from "react";
import ServicesConfigClient from "./ServicesConfigClient";

export const dynamic = "force-dynamic"

export default function ServicesConfigPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Service Configuration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure CTA links and Asana fulfillment assignments for each service.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
        <ServicesConfigClient />
      </Suspense>
    </div>
  );
}
