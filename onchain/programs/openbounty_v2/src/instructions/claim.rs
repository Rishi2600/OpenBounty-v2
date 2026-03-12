use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::error::EscrowError;
use crate::state::Escrow;

/// Claim prize for a specific tier
///
/// This instruction allows a winner to claim their prize after being finalized
/// by the judges. The winner must call this instruction themselves.
///
/// ## How It Works:
///
/// 1. **Verify Winner**: Check that caller is the actual winner for this tier
/// 2. **Verify Not Claimed**: Ensure prize hasn't been claimed already
/// 3. **Transfer Funds**: Move SOL from vault PDA to winner's wallet
/// 4. **Mark Claimed**: Update state to prevent double-claiming
///
/// ## Security:
/// - Only the designated winner can claim
/// - Cannot claim twice (idempotency check)
/// - Uses PDA signer to transfer from vault (only program can sign)
/// - Winner controls timing (permissionless claiming)
///
pub fn claim_prize(ctx: Context<ClaimPrize>, tier: u8) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;

    // Validation: Check tier index is valid
    require!(
        (tier as usize) < escrow.tiers.len(),
        EscrowError::InvalidTier
    );

    let prize_tier = &mut escrow.tiers[tier as usize];

    // Validation: Check that winner has been finalized
    require!(
        prize_tier.winner.is_some(),
        EscrowError::NotFinalized
    );

    // Validation: Check that caller is the actual winner
    let winner_pubkey = prize_tier.winner.unwrap();
    require!(
        ctx.accounts.winner.key() == winner_pubkey,
        EscrowError::Unauthorized
    );

    // Validation: Check that prize has not been claimed yet
    require!(
        !prize_tier.claimed,
        EscrowError::TierAlreadyClaimed
    );

    // Get the prize amount
    let prize_amount = prize_tier.amount;

    msg!("Claiming prize for tier {}", tier);
    msg!("Winner: {}", winner_pubkey);
    msg!("Amount: {} lamports", prize_amount);

    // Transfer SOL from vault to winner
    // We need to use the vault's PDA signer since the vault is owned by the program
    let organizer_key = escrow.organizer.key();
    let vault_seeds = &[
        b"vault",
        organizer_key.as_ref(),
        &[escrow.vault_bump],
    ];
    let vault_signer = &[&vault_seeds[..]];

    // Create transfer instruction from vault to winner
    let transfer_accounts = Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.winner.to_account_info(),
    };
    
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        transfer_accounts,
        vault_signer, // PDA signer - only program can sign for vault
    );

    // Execute the transfer
    transfer(cpi_context, prize_amount)?;

    // Mark the prize as claimed
    prize_tier.claimed = true;

    msg!("Prize claimed successfully!");
    msg!("Transferred {} lamports to {}", prize_amount, winner_pubkey);

    Ok(())
}

/// Account validation for claim_prize instruction
#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    /// Escrow account containing prize tier information
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,

    /// Vault PDA that holds the locked SOL
    /// This account will have SOL deducted when prize is claimed
    /// CHECK: Vault PDA is validated by seeds
    #[account(
        mut,
        seeds = [b"vault", escrow.organizer.as_ref()],
        bump = escrow.vault_bump,
    )]
    pub vault: AccountInfo<'info>,

    /// Winner claiming the prize (must be a signer)
    /// This must match the winner recorded in the escrow tier
    #[account(mut)]
    pub winner: Signer<'info>,

    /// System program for transferring SOL
    pub system_program: Program<'info, System>,
}