use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::error::EscrowError;
use crate::state::Escrow;

/// Refund unclaimed prizes to organizer after deadline
///
/// This instruction allows the organizer to reclaim funds for prizes
/// that were not claimed by winners before the deadline.
///
/// ## How It Works:
///
/// 1. **Verify Deadline**: Check that the claim deadline has passed
/// 2. **Verify Organizer**: Ensure caller is the original organizer
/// 3. **Calculate Unclaimed**: Sum up all unclaimed prize amounts
/// 4. **Transfer Funds**: Move SOL from vault back to organizer
///
/// ## Security:
/// - Only organizer can call this
/// - Only works after deadline has passed
/// - Only refunds unclaimed prizes (claimed prizes are excluded)
/// - Uses PDA signer to transfer from vault
///
/// ## Use Cases:
/// - Winner never claimed their prize
/// - Hackathon had no submissions for some tiers
/// - Organizer wants to recover unclaimed funds
///
pub fn refund_unclaimed(ctx: Context<RefundUnclaimed>) -> Result<()> {
    let escrow = &ctx.accounts.escrow;
    
    // Get current Unix timestamp
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    msg!("Current time: {}", current_time);
    msg!("Deadline: {}", escrow.deadline);

    // Validation: Check that deadline has passed
    require!(
        current_time > escrow.deadline,
        EscrowError::DeadlineNotPassed
    );

    // Validation: Check that caller is the organizer
    require!(
        ctx.accounts.organizer.key() == escrow.organizer,
        EscrowError::Unauthorized
    );

    // Calculate total unclaimed amount
    let mut unclaimed_amount: u64 = 0;
    let mut claimed_count = 0;
    let mut unclaimed_count = 0;

    for (index, tier) in escrow.tiers.iter().enumerate() {
        if tier.winner.is_some() && !tier.claimed {
            // Winner was set but never claimed
            unclaimed_amount += tier.amount;
            unclaimed_count += 1;
            msg!("Tier {} unclaimed: {} lamports", index, tier.amount);
        } else if tier.winner.is_some() && tier.claimed {
            // Winner claimed successfully
            claimed_count += 1;
            msg!("Tier {} already claimed", index);
        } else {
            // No winner was ever set (also unclaimed)
            unclaimed_amount += tier.amount;
            unclaimed_count += 1;
            msg!("Tier {} had no winner: {} lamports", index, tier.amount);
        }
    }

    msg!("Total tiers: {}", escrow.tiers.len());
    msg!("Claimed tiers: {}", claimed_count);
    msg!("Unclaimed tiers: {}", unclaimed_count);
    msg!("Total unclaimed amount: {} lamports", unclaimed_amount);

    // Check if there's anything to refund
    require!(
        unclaimed_amount > 0,
        EscrowError::NoUnclaimedFunds
    );

    // Transfer unclaimed funds from vault to organizer
    let organizer_key = escrow.organizer.key();
    let vault_seeds = &[
        b"vault",
        organizer_key.as_ref(),
        &[escrow.vault_bump],
    ];
    let vault_signer = &[&vault_seeds[..]];

    // Create transfer instruction from vault to organizer
    let transfer_accounts = Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to: ctx.accounts.organizer.to_account_info(),
    };
    
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        transfer_accounts,
        vault_signer, // PDA signer - only program can sign for vault
    );

    // Execute the transfer
    transfer(cpi_context, unclaimed_amount)?;

    msg!("Refund successful!");
    msg!("Transferred {} lamports to organizer {}", unclaimed_amount, escrow.organizer);

    Ok(())
}

/// Account validation for refund_unclaimed instruction
#[derive(Accounts)]
pub struct RefundUnclaimed<'info> {
    /// Escrow account containing prize tier information
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,

    /// Vault PDA that holds the locked SOL
    /// This account will have unclaimed SOL transferred back to organizer
    /// CHECK: Vault PDA is validated by seeds
    #[account(
        mut,
        seeds = [b"vault", escrow.organizer.as_ref()],
        bump = escrow.vault_bump,
    )]
    pub vault: AccountInfo<'info>,

    /// Organizer receiving the refund (must be a signer)
    /// This must match the organizer recorded in the escrow
    #[account(mut)]
    pub organizer: Signer<'info>,

    /// System program for transferring SOL
    pub system_program: Program<'info, System>,
}