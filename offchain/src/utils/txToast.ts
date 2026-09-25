// Toasts for finished transactions: success with an explorer link, or a plain-English error.

import { toast } from "sonner";
import { explorerUrl } from "@/constants/program";
import { USE_MOCKS } from "@/mocks/store";
import { friendlyTxError } from "./txErrors";

export function toastTxSuccess(message: string, signature: string): void {
  if (USE_MOCKS) {
    toast.success(message, { description: "Mock transaction: nothing was sent." });
    return;
  }
  toast.success(message, {
    action: {
      label: "View",
      onClick: () => window.open(explorerUrl(signature), "_blank", "noreferrer"),
    },
  });
}

export function toastTxError(err: unknown): void {
  toast.error(friendlyTxError(err));
}
