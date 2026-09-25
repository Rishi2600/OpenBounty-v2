// Thin strip at the top of every page while mock mode is on,
// so sample data is never mistaken for real on-chain data.

import { USE_MOCKS } from "@/mocks/store";

export default function MockBanner() {
  if (!USE_MOCKS) return null;

  return (
    <div className="border-b border-primary/40 bg-accent px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-accent-foreground">
      Mock data mode: nothing here is on-chain and no transactions are sent
    </div>
  );
}
