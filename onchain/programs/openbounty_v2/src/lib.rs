use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction;

declare_id!("CdWRw7fqNCBpz34qHoFjua9Nry6pbhnVrsfpgMemKKrL");

#[program]
pub mod hack_escrow {
    use super::*;

    // 1. Initialize the escrow vault
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        amount: u64,
        judges: Vec<Pubkey>,
        threshold: u8,
        tiers: Vec<u64>,
        deadline: i64,
    ) -> Result<()> {
        // Logic to create the escrow vault and store metadata
        Ok(())
    }

    // 2. Judges sign a winner (off-chain; on-chain verification)
    pub fn finalize_winner(
        ctx: Context<FinalizeWinner>,
        tier: u8,
        winner: Pubkey,
        signatures: Vec<[u8; 64]>, // Ed25519 signatures
    ) -> Result<()> {
        // Logic to verify signatures and mark the tier as claimed
        Ok(())
    }

    // 3. Winner claims their prize
    pub fn claim_prize(ctx: Context<ClaimPrize>, tier: u8) -> Result<()> {
        // Logic to transfer funds to the winner
        Ok(())
    }

    // 4. Organizer refunds unclaimed funds after deadline
    pub fn refund_unclaimed(ctx: Context<RefundUnclaimed>) -> Result<()> {
        // Logic to return funds to the organizer
        Ok(())
    }
}

// Define custom errors
#[error_code]
pub enum EscrowError {
    #[msg("Signature verification failed")]
    InvalidSignature,
    #[msg("Insufficient signatures")]
    InsufficientSignatures,
    #[msg("Tier already claimed")]
    TierAlreadyClaimed,
    #[msg("Deadline not reached")]
    DeadlineNotReached,
    #[msg("Escrow expired")]
    EscrowExpired,
    #[msg("Invalid judge")]
    InvalidJudge,
}

// Context structs for each instruction
#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(init, payer = organizer, space = 8 + Escrow::LEN)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub organizer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeWinner<'info> {
    #[account(mut, has_one = organizer)]
    pub escrow: Account<'info, Escrow>,
    pub organizer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut, has_one = organizer)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub winner: SystemAccount<'info>,
    pub organizer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundUnclaimed<'info> {
    #[account(mut, has_one = organizer)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub organizer: Signer<'info>,
}

// Escrow account structure
#[account]
pub struct Escrow {
    pub organizer: Pubkey,
    pub judges: Vec<Pubkey>,
    pub threshold: u8,
    pub tiers: Vec<u64>,
    pub claimed_tiers: Vec<bool>, 
    pub deadline: i64,
    pub vault_bump: u8,
}

impl Escrow {
    const LEN: usize = 32 +
                       4 + 5 * 32 +
                       1 +
                       4 + 4 * 8 +
                       4 + 4 * 1 +
                       8 +
                       1;
}
