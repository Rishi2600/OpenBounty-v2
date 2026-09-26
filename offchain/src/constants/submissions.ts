// Limits for bounty entries, and the preview switch. Entries exist only in mock mode
// until the program has a submit_entry instruction (see docs/features/judging.md).

import { USE_MOCKS } from "@/mocks/config";

export const SUBMISSIONS_PREVIEW = USE_MOCKS;

export const MAX_SUBMISSION_TITLE = 50;
export const MAX_SUBMISSION_DESCRIPTION = 280;
