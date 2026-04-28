use anchor_lang::prelude::*;

/// Main escrow account that holds all bounty metadata
#[account]
pub struct Escrow {
    /// Human-readable title for the bounty (max 50 characters)
    pub title: String,

    /// URI pointing to off-chain metadata JSON (max 100 characters)
    /// Follows Metaplex convention — can be IPFS or Arweave URI
    /// e.g. "ipfs://QmXyz..." or "https://arweave.net/abc..."
    /// Empty string if organizer chooses not to provide metadata
    pub metadata_uri: String,

    /// Organizer's public key (who created the escrow)
    pub organizer: Pubkey,

    /// List of judge public keys (e.g., 5 judges)
    pub judges: Vec<Pubkey>,

    /// Minimum number of judges required to approve a winner (e.g., 3 out of 5)
    pub threshold: u8,

    /// Prize tiers in lamports (e.g., [20 SOL, 15 SOL, 10 SOL, 5 SOL])
    pub tiers: Vec<PrizeTier>,

    /// Unix timestamp for when unclaimed funds can be refunded
    pub deadline: i64,

    /// Bump seed for the escrow PDA
    pub bump: u8,

    /// Bump seed for the vault PDA (holds the actual SOL)
    pub vault_bump: u8,
}

impl Escrow {
    /// Calculate the space needed for the account
    /// Formula: discriminator + all field sizes
    pub const LEN: usize =
        8 +                           // Anchor discriminator
        4 + 50 +                      // title: String (4 length prefix + max 50 chars)
        4 + 100 +                     // metadata_uri: String (4 length prefix + max 100 chars)
        32 +                          // organizer: Pubkey
        4 + (5 * 32) +                // judges: Vec<Pubkey> (max 5 judges)
        1 +                           // threshold: u8
        4 + (4 * PrizeTier::LEN) +    // tiers: Vec<PrizeTier> (max 4 tiers)
        8 +                           // deadline: i64
        1 +                           // bump: u8
        1;                            // vault_bump: u8
}

/// Individual prize tier with winner and claim status
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct PrizeTier {
    /// Amount of SOL for this tier (in lamports)
    pub amount: u64,

    /// Winner's public key (None if not yet assigned)
    pub winner: Option<Pubkey>,

    /// Whether this tier has been claimed
    pub claimed: bool,
}

impl PrizeTier {
    /// Space calculation for a single PrizeTier
    pub const LEN: usize =
        8 +        // amount: u64
        1 + 32 +   // winner: Option<Pubkey> (1 byte tag + 32 bytes Pubkey)
        1;         // claimed: bool
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_escrow_space_calculation() {
        let expected =
            8 +           // discriminator
            (4 + 50) +    // title
            (4 + 100) +   // metadata_uri
            32 +          // organizer
            (4 + 5 * 32) + // judges
            1 +           // threshold
            (4 + 4 * 41) + // tiers
            8 +           // deadline
            1 +           // bump
            1;            // vault_bump
        assert_eq!(Escrow::LEN, expected);
    }

    #[test]
    fn test_prize_tier_space() {
        assert_eq!(PrizeTier::LEN, 41);
    }
}