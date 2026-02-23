[error]
pub enum EscrowError {
    #[msg("Account not initialized")]
    NotInitialized,

    #[msg("Invalid secret provided")]
    InvalidSecret,

    #[msg("Bounty has already been claimed")]
    AlreadyClaimed,

    #[msg("Bounty has expired")]
    BountyExpired,

    #[msg("Bounty has not expired yet")]
    NotExpired,

    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Invalid bounty ID")]
    InvalidBountyId,

    #[msg("Math overflow error")]
    MathOverflow,

    #[msg("Token transfer failed")]
    TokenTransferFailed,

    #[msg("Invalid token account")]
    InvalidTokenAccount,
}
