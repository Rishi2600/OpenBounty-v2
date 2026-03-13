use anchor_lang::prelude::*;

declare_id!("CdWRw7fqNCBpz34qHoFjua9Nry6pbhnVrsfpgMemKKrL");

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod openbounty_v2 {
    use super::*;

    /// Initialize a new bounty escrow
    /// 
    /// Creates an escrow account and locks funds in a vault PDA.
    /// Organizer specifies judges, voting threshold, prize tiers, and deadline.
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        judges: Vec<Pubkey>,
        threshold: u8,
        tier_amounts: Vec<u64>,
        deadline: i64,
    ) -> Result<()> {
        instructions::initialize_escrow(ctx, judges, threshold, tier_amounts, deadline)
    }

    /// Finalize winner for a specific tier
    /// 
    /// Judges sign off-chain, signatures are verified on-chain.
    /// When threshold is met, winner is recorded for the tier.
    pub fn finalize_winner(
        ctx: Context<FinalizeWinner>,
        tier: u8,
        winner: Pubkey,
        judge_signatures: Vec<[u8; 64]>,
    ) -> Result<()> {
        instructions::finalize_winner(ctx, tier, winner, judge_signatures)
    }

    /// Claim prize for a specific tier
    /// 
    /// Winner calls this after being finalized by judges.
    /// Transfers funds from vault to winner's wallet.
    pub fn claim_prize(ctx: Context<ClaimPrize>, tier: u8) -> Result<()> {
        instructions::claim_prize(ctx, tier)
    }

    /// Refund unclaimed prizes to organizer after deadline
    /// 
    /// Organizer calls this after deadline passes to reclaim
    /// funds for prizes that were never claimed.
    pub fn refund_unclaimed(ctx: Context<RefundUnclaimed>) -> Result<()> {
        instructions::refund_unclaimed(ctx)
    }
}