use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Bounty {
    /// The organizer/creator of the bounty
    pub organizer: Pubkey,
    /// The token mint (None for native SOL, Some for SPL tokens)
    pub mint: Option<Pubkey>,
    /// The vault PDA that holds the funds
    pub vault: Pubkey,
    /// Amount in lamports (SOL) or smallest units (SPL tokens)
    pub amount: u64,
    /// SHA256 hash of the secret key
    pub secret_hash: [u8; 32],
    /// Unix timestamp when the bounty expires
    pub deadline: i64,
    /// Whether the bounty has been claimed
    pub is_claimed: bool,
    /// Optional: specific recipient who can claim (None = anyone with secret)
    pub recipient: Option<Pubkey>,
    /// Bump seed for PDA
    pub bump: u8,
    /// Vault bump seed
    pub vault_bump: u8,
    /// Bounty title/description
    pub title: String,
    /// Creation timestamp
    pub created_at: i64,
}

impl Bounty {
    pub const MAX_SIZE: usize = 32 + 1 + 32 + 8 + 32 + 8 + 1 + 1 + 32 + 1 + 1 + 50 + 8;

    pub fn is_expired(&self, current_time: i64) -> bool {
        current_time > self.deadline
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Vault {
    pub bump: u8,
}

impl Vault {
    pub const MAX_SIZE: usize = 1;
}
