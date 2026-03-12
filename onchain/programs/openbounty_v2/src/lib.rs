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

    /// Claim prize for a specific tier (TO BE IMPLEMENTED IN CHUNK 3)
    /// 
    /// Winner calls this after being finalized by judges.
    /// Transfers funds from vault to winner's wallet.
    pub fn claim_prize(_ctx: Context<ClaimPrize>, _tier: u8) -> Result<()> {
        // TODO: Implement in Chunk 3
        msg!("claim_prize - Coming in Chunk 3!");
        Ok(())
    }

    /// Refund unclaimed funds after deadline (TO BE IMPLEMENTED IN CHUNK 4)
    /// 
    /// Organizer can reclaim any unclaimed prizes after deadline expires.
    pub fn refund_unclaimed(_ctx: Context<RefundUnclaimed>) -> Result<()> {
        // TODO: Implement in Chunk 4
        msg!("refund_unclaimed - Coming in Chunk 4!");
        Ok(())
    }
}


#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut)]
    pub escrow: Account<'info, state::Escrow>,
    /// CHECK: Vault PDA
    #[account(mut)]
    pub vault: AccountInfo<'info>,
    #[account(mut)]
    pub winner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundUnclaimed<'info> {
    #[account(mut)]
    pub escrow: Account<'info, state::Escrow>,
    /// CHECK: Vault PDA
    #[account(mut)]
    pub vault: AccountInfo<'info>,
    #[account(mut)]
    pub organizer: Signer<'info>,
    pub system_program: Program<'info, System>,
}