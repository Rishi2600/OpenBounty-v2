#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod error;
pub mod state;
pub mod instructions;

use instructions::*;

declare_id!("CdWRw7fqNCBpz34qHoFjua9Nry6pbhnVrsfpgMemKKrL");

#[program]
pub mod openbounty_v2 {
    use super::*;

    /// Create a new bounty escrow and lock funds
    /// nonce allows the same wallet to create multiple escrows
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        title: String,
        metadata_uri: String,
        judges: Vec<Pubkey>,
        threshold: u8,
        tier_amounts: Vec<u64>,
        deadline: i64,
        nonce: u8,
    ) -> Result<()> {
        instructions::initialize_escrow(
            ctx,
            title,
            metadata_uri,
            judges,
            threshold,
            tier_amounts,
            deadline,
            nonce,
        )
    }

    /// Judge casts a vote for a winner on a specific tier
    /// Auto-finalizes when vote count reaches threshold
    pub fn vote_winner(
        ctx: Context<VoteWinner>,
        nonce: u8,
        tier: u8,
        candidate: Pubkey,
    ) -> Result<()> {
        instructions::vote_winner(ctx, nonce, tier, candidate)
    }

    /// Winner claims their prize for a finalized tier
    /// Closes escrow when all tiers are claimed
    pub fn claim_prize(
        ctx: Context<ClaimPrize>,
        nonce: u8,
        tier: u8,
    ) -> Result<()> {
        instructions::claim_prize(ctx, nonce, tier)
    }

    /// Organizer refunds unclaimed prizes after deadline
    /// Closes escrow after refunding
    pub fn refund_unclaimed(
        ctx: Context<RefundUnclaimed>,
        nonce: u8,
    ) -> Result<()> {
        instructions::refund_unclaimed(ctx, nonce)
    }
}