use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::error::EscrowError;
use crate::state::Escrow;

/// Refund unclaimed prizes after deadline
///
/// Changes from v1:
/// - PDA seeds now include nonce
/// - After refunding, closes escrow and vault accounts
///   returning rent to the organizer
pub fn refund_unclaimed(
    ctx: Context<RefundUnclaimed>,
    nonce: u8,
) -> Result<()> {
    let escrow   = &mut ctx.accounts.escrow;
    let clock    = Clock::get()?;
    let organizer = escrow.organizer;
    let vault_bump = escrow.vault_bump;

    // Only organizer can refund
    require!(
        ctx.accounts.organizer.key() == organizer,
        EscrowError::Unauthorized
    );

    // Deadline must have passed
    require!(
        clock.unix_timestamp > escrow.deadline,
        EscrowError::DeadlineNotPassed
    );

    // Calculate total unclaimed amount
    let unclaimed_total: u64 = escrow
        .tiers
        .iter()
        .filter(|t| !t.claimed)
        .map(|t| t.amount)
        .sum();

    require!(unclaimed_total > 0, EscrowError::NoUnclaimedFunds);

    // Mark all unclaimed tiers as claimed (prevents double refund)
    for tier in escrow.tiers.iter_mut() {
        if !tier.claimed {
            tier.claimed = true;
        }
    }

    // Transfer unclaimed SOL from vault back to organizer
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"vault",
        organizer.as_ref(),
        &[nonce],
        &[vault_bump],
    ]];

    let transfer_accounts = Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to:   ctx.accounts.organizer.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        transfer_accounts,
        signer_seeds,
    );
    transfer(cpi_context, unclaimed_total)?;

    msg!(
        "Refunded {} lamports to organizer: {}",
        unclaimed_total, organizer
    );

    // Close vault — transfer any remaining dust lamports to organizer
    let vault_remaining = ctx.accounts.vault.lamports();
    if vault_remaining > 0 {
        let transfer_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to:   ctx.accounts.organizer.to_account_info(),
        };
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            transfer_accounts,
            signer_seeds,
        );
        transfer(cpi_context, vault_remaining)?;
    }

    // Close escrow — move lamports to organizer
    let escrow_lamports = ctx.accounts.escrow.to_account_info().lamports();
    **ctx.accounts.escrow.to_account_info().lamports.borrow_mut() = 0;
    **ctx.accounts.organizer.to_account_info().lamports.borrow_mut() += escrow_lamports;

    msg!("Escrow closed after refund — rent returned to organizer");

    Ok(())
}

#[derive(Accounts)]
#[instruction(nonce: u8)]
pub struct RefundUnclaimed<'info> {
    #[account(
        mut,
        seeds = [b"escrow", organizer.key().as_ref(), &[nonce]],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: Vault PDA holding the SOL
    #[account(
        mut,
        seeds = [b"vault", organizer.key().as_ref(), &[nonce]],
        bump = escrow.vault_bump,
    )]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub organizer: Signer<'info>,

    pub system_program: Program<'info, System>,
}