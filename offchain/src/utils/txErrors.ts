// Turns wallet and program errors into short plain-English messages for toasts.
// Program error names come from onchain/programs/openbounty_v2/src/error.rs.

const PROGRAM_ERRORS: Record<string, string> = {
  InvalidTitle:         "The title must be 1 to 50 characters.",
  InvalidMetadataUri:   "The metadata link must be 100 characters or fewer.",
  NoJudges:             "Add at least one judge.",
  NoTiers:              "Add at least one prize.",
  InvalidThreshold:     "Votes needed can't be more than the number of judges.",
  InvalidDeadline:      "The deadline must be in the future.",
  InvalidAmount:        "The prize pool must be more than 0 SOL.",
  EscrowExpired:        "This bounty has ended, so voting is closed.",
  NotAJudge:            "Only this bounty's judges can vote.",
  AlreadyVoted:         "You've already voted on this prize.",
  TierAlreadyFinalized: "This prize already has a winner.",
  InvalidTier:          "That prize doesn't exist.",
  NotFinalized:         "This prize doesn't have a winner yet.",
  TierAlreadyClaimed:   "This prize has already been claimed.",
  Unauthorized:         "Your wallet isn't allowed to do this.",
  DeadlineNotPassed:    "Refunds open after the deadline.",
  NoUnclaimedFunds:     "There's nothing left to refund.",
  AccountNotInitialized: "This bounty is closed.",
};

// Wallet and network errors, matched by a piece of their message
const OTHER_ERRORS: [string, string][] = [
  ["User rejected",               "You cancelled the transaction in your wallet."],
  ["already in use",              "That bounty slot was just taken. Please try again."],
  ["insufficient lamports",       "Your wallet doesn't have enough SOL."],
  ["no record of a prior credit", "Your wallet doesn't have enough SOL."],
  ["Blockhash not found",         "The network was busy. Please try again."],
];

export function friendlyTxError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  for (const [name, text] of Object.entries(PROGRAM_ERRORS)) {
    if (message.includes(`Error Code: ${name}`)) return text;
  }
  for (const [piece, text] of OTHER_ERRORS) {
    if (message.includes(piece)) return text;
  }

  console.error("Unmapped transaction error:", err);
  return "The transaction failed. Please try again.";
}
