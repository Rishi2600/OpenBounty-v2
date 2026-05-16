use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::error::EscrowError;
use crate::state::Escrow;

/// Claim a prize for a finalized tier
///
/// Changes from v1:
/// - PDA seeds now include nonce
/// - After claiming, if all tiers are claimed the escrow and vault
///   accounts are closed and rent is returned to the organizer
pub fn claim_prize(
    ctx: Context<ClaimPrize>,
    nonce: u8,
    tier: u8,
) -> Result<()> {
    let tier_index = tier as usize;
    let winner     = ctx.accounts.winner.key();

    // Validate tier index
    require!(
        tier_index < ctx.accounts.escrow.tiers.len(),
        EscrowError::InvalidTier
    );

    // Tier must be finalized (winner set)
    require!(
        ctx.accounts.escrow.tiers[tier_index].winner.is_some(),
        EscrowError::NotFinalized
    );

    // Tier must not already be claimed
    require!(
        !ctx.accounts.escrow.tiers[tier_index].claimed,
        EscrowError::TierAlreadyClaimed
    );

    // Signer must be the winner
    require!(
        ctx.accounts.escrow.tiers[tier_index].winner.unwrap() == winner,
        EscrowError::Unauthorized
    );

    // Get prize amount before mutating
    let prize_amount = ctx.accounts.escrow.tiers[tier_index].amount;
    let organizer    = ctx.accounts.escrow.organizer;
    let vault_bump   = ctx.accounts.escrow.vault_bump;

    // Mark tier as claimed
    ctx.accounts.escrow.tiers[tier_index].claimed = true;

    // Transfer prize from vault to winner using PDA signer seeds
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"vault",
        organizer.as_ref(),
        &[nonce],
        &[vault_bump],
    ]];

    let transfer_accounts = Transfer {
        from: ctx.accounts.vault.to_account_info(),
        to:   ctx.accounts.winner.to_account_info(),
    };
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        transfer_accounts,
        signer_seeds,
    );
    transfer(cpi_context, prize_amount)?;

    msg!(
        "Prize claimed — tier: {}, winner: {}, amount: {} lamports",
        tier, winner, prize_amount
    );

    // Check if all tiers are now claimed
    let all_claimed = ctx.accounts.escrow.tiers.iter().all(|t| t.claimed);

    if all_claimed {
        msg!("All tiers claimed — closing escrow and vault accounts");

        // Close vault — transfer remaining lamports to organizer
        let vault_lamports = ctx.accounts.vault.lamports();
        if vault_lamports > 0 {
            let transfer_accounts = Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to:   ctx.accounts.organizer.to_account_info(),
            };
            let cpi_context = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                transfer_accounts,
                signer_seeds,
            );
            transfer(cpi_context, vault_lamports)?;
        }

        // Close escrow — move lamports to organizer, Anchor handles zeroing
        let escrow_lamports = ctx.accounts.escrow.to_account_info().lamports();
        **ctx.accounts.escrow.to_account_info().lamports.borrow_mut() = 0;
        **ctx.accounts.organizer.to_account_info().lamports.borrow_mut() += escrow_lamports;

        msg!("Escrow closed — rent returned to organizer: {}", organizer);
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(nonce: u8, tier: u8)]
pub struct ClaimPrize<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.organizer.as_ref(), &[nonce]],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: Vault PDA that holds the SOL
    #[account(
        mut,
        seeds = [b"vault", escrow.organizer.as_ref(), &[nonce]],
        bump = escrow.vault_bump,
    )]
    pub vault: AccountInfo<'info>,

    /// The winner claiming their prize — must match tier.winner
    #[account(mut)]
    pub winner: Signer<'info>,

    /// Organizer receives rent when escrow closes
    /// CHECK: Verified against escrow.organizer inside the instruction
    #[account(
        mut,
        constraint = organizer.key() == escrow.organizer @ EscrowError::Unauthorized
    )]
    pub organizer: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}