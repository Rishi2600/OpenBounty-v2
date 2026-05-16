use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Invalid signature provided")]
    InvalidSignature,

    #[msg("Insufficient signatures to meet threshold")]
    InsufficientSignatures,

    #[msg("This tier has already been claimed")]
    TierAlreadyClaimed,

    #[msg("The deadline has not been reached yet")]
    DeadlineNotReached,

    #[msg("This escrow has expired")]
    EscrowExpired,

    #[msg("Invalid judge provided")]
    InvalidJudge,

    #[msg("Invalid tier index")]
    InvalidTier,

    #[msg("Invalid threshold")]
    InvalidThreshold,

    #[msg("No judges provided")]
    NoJudges,

    #[msg("No tiers provided")]
    NoTiers,

    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("Invalid deadline")]
    InvalidDeadline,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("This tier has already been finalized")]
    AlreadyFinalized,

    #[msg("This tier has not been finalized yet")]
    NotFinalized,

    #[msg("Invalid message")]
    InvalidMessage,

    #[msg("Deadline has not passed yet")]
    DeadlineNotPassed,

    #[msg("No unclaimed funds to refund")]
    NoUnclaimedFunds,

    #[msg("Title is empty or exceeds 50 characters")]
    InvalidTitle,

    #[msg("Metadata URI exceeds 100 characters")]
    InvalidMetadataUri,

    // New errors for vote_winner instruction
    #[msg("This judge has already voted on this tier")]
    AlreadyVoted,

    #[msg("Signer is not a judge on this escrow")]
    NotAJudge,

    #[msg("This tier has already been finalized and cannot receive more votes")]
    TierAlreadyFinalized,
}