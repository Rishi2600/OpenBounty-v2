use anchor_lang::prelude::*;

// TierVote — records a single judge's vote on a prize tier
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TierVote {
    pub judge:     Pubkey,   // 32 bytes — who cast this vote
    pub candidate: Pubkey,   // 32 bytes — who they voted for
}

// PrizeTier — one prize tier within an escrow
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PrizeTier {
    pub amount:  u64,            // 8 bytes
    pub winner:  Option<Pubkey>, // 33 bytes (1 discriminant + 32 pubkey)
    pub claimed: bool,           // 1 byte
    pub votes:   Vec<TierVote>,  // 4 + (64 * 5) = 324 bytes (max 5 judges)
}

// Escrow — the main account storing all bounty metadata and state
#[account]
pub struct Escrow {
    pub title:        String,        // 4 + 50 = 54 bytes
    pub metadata_uri: String,        // 4 + 100 = 104 bytes
    pub organizer:    Pubkey,        // 32 bytes
    pub nonce:        u8,            // 1 byte  — NEW: supports multiple bounties per wallet
    pub judges:       Vec<Pubkey>,   // 4 + (32 * 5) = 164 bytes
    pub threshold:    u8,            // 1 byte
    pub tiers:        Vec<PrizeTier>,// 4 + (366 * 4) = 1468 bytes (see PrizeTier size below)
    pub deadline:     i64,           // 8 bytes
    pub bump:         u8,            // 1 byte
    pub vault_bump:   u8,            // 1 byte
}

impl Escrow {
    ///
    // LEN calculation
    //
    // Discriminator:       8
    // title:               4 + 50  = 54
    // metadata_uri:        4 + 100 = 104
    // organizer:           32
    // nonce:               1
    // judges vec:          4 + (32 * 5) = 164
    // threshold:           1
    // tiers vec:           4 + (PrizeTier::LEN * 4)
    //   PrizeTier::LEN:
    //     amount:          8
    //     winner:          33
    //     claimed:         1
    //     votes vec:       4 + (TierVote::LEN * 5)
    //       TierVote::LEN: 32 + 32 = 64
    //     votes total:     4 + (64 * 5) = 324
    //   PrizeTier total:   8 + 33 + 1 + 324 = 366
    // tiers total:         4 + (366 * 4)    = 1468
    // deadline:            8
    // bump:                1
    // vault_bump:          1
    //
    // Total: 8 + 54 + 104 + 32 + 1 + 164 + 1 + 1468 + 8 + 1 + 1 = 1842
    ///
    /// 
    pub const LEN: usize = 8   // discriminator
        + 54                   // title
        + 104                  // metadata_uri
        + 32                   // organizer
        + 1                    // nonce
        + 164                  // judges
        + 1                    // threshold
        + 1468                 // tiers
        + 8                    // deadline
        + 1                    // bump
        + 1;                   // vault_bump
}