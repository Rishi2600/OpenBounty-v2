use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Signature verification failed")]
    InvalidSignature,
    
    #[msg("Insufficient signatures - need more judge approvals")]
    InsufficientSignatures,
    
    #[msg("This tier has already been claimed")]
    TierAlreadyClaimed,
    
    #[msg("Deadline has not been reached yet")]
    DeadlineNotReached,
    
    #[msg("Escrow has expired - claiming period is over")]
    EscrowExpired,
    
    #[msg("Invalid judge - not in authorized judge list")]
    InvalidJudge,
    
    #[msg("Invalid tier index - tier does not exist")]
    InvalidTier,
    
    #[msg("Threshold must be less than or equal to number of judges")]
    InvalidThreshold,
    
    #[msg("Must have at least one judge")]
    NoJudges,
    
    #[msg("Must have at least one prize tier")]
    NoTiers,
    
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    
    #[msg("Deadline must be in the future")]
    InvalidDeadline,
    
    #[msg("Unauthorized - you are not the organizer")]
    Unauthorized,
    
    #[msg("Winner already finalized for this tier")]
    AlreadyFinalized,
    
    #[msg("Cannot claim - winner not yet finalized")]
    NotFinalized,
    
    #[msg("Message format invalid for signature verification")]
    InvalidMessage,
    
    #[msg("Deadline has not passed yet - cannot refund")]
    DeadlineNotPassed,
    
    #[msg("No unclaimed funds available to refund")]
    NoUnclaimedFunds,

    // NEW — metadata validation errors
    #[msg("Title must be between 1 and 50 characters")]
    InvalidTitle,

    #[msg("Metadata URI must be 100 characters or fewer")]
    InvalidMetadataUri,
}