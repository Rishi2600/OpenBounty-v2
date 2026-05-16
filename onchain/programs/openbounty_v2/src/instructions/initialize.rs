use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::error::EscrowError;
use crate::state::{Escrow, PrizeTier, TierVote};

/// Initialize a new bounty escrow
///
/// Changes from v1:
/// - Added nonce: u8 to support multiple escrows per organizer wallet
/// - PDA seeds now include nonce: ["escrow", organizer, nonce]
/// - Each PrizeTier initialized with empty votes vec
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
    let escrow = &mut ctx.accounts.escrow;
    let clock   = Clock::get()?;

    // Validate title — required, max 50 chars
    require!(
        !title.is_empty() && title.len() <= 50,
        EscrowError::InvalidTitle
    );

    // Validate metadata_uri — optional, max 100 chars
    require!(
        metadata_uri.len() <= 100,
        EscrowError::InvalidMetadataUri
    );

    require!(!judges.is_empty(),   EscrowError::NoJudges);
    require!(!tier_amounts.is_empty(), EscrowError::NoTiers);
    require!(
        threshold > 0 && threshold <= judges.len() as u8,
        EscrowError::InvalidThreshold
    );
    require!(deadline > clock.unix_timestamp, EscrowError::InvalidDeadline);

    let total_amount: u64 = tier_amounts.iter().sum();
    require!(total_amount > 0, EscrowError::InvalidAmount);

    // Transfer total prize pool from organizer to vault
    let transfer_accounts = Transfer {
        from: ctx.accounts.organizer.to_account_info(),
        to:   ctx.accounts.vault.to_account_info(),
    };
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        transfer_accounts,
    );
    transfer(cpi_context, total_amount)?;

    // Initialize prize tiers — each starts with empty votes
    let prize_tiers: Vec<PrizeTier> = tier_amounts
        .iter()
        .map(|&amount| PrizeTier {
            amount,
            winner:  None,
            claimed: false,
            votes:   Vec::new(),
        })
        .collect();

    // Store escrow data
    escrow.title        = title;
    escrow.metadata_uri = metadata_uri;
    escrow.organizer    = ctx.accounts.organizer.key();
    escrow.nonce        = nonce;
    escrow.judges       = judges;
    escrow.threshold    = threshold;
    escrow.tiers        = prize_tiers;
    escrow.deadline     = deadline;
    escrow.bump         = ctx.bumps.escrow;
    escrow.vault_bump   = ctx.bumps.vault;

    msg!("Escrow initialized — title: {}, nonce: {}", escrow.title, nonce);
    msg!("Organizer: {}", escrow.organizer);
    msg!("Total locked: {} lamports", total_amount);
    msg!("Judges: {}, Threshold: {}", escrow.judges.len(), escrow.threshold);

    Ok(())
}

#[derive(Accounts)]
#[instruction(title: String, metadata_uri: String, judges: Vec<Pubkey>, threshold: u8, tier_amounts: Vec<u64>, deadline: i64, nonce: u8)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = organizer,
        space = Escrow::LEN,
        seeds = [b"escrow", organizer.key().as_ref(), &[nonce]],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: Vault PDA that holds the locked SOL
    #[account(
        mut,
        seeds = [b"vault", organizer.key().as_ref(), &[nonce]],
        bump
    )]
    pub vault: AccountInfo<'info>,

    #[account(mut)]
    pub organizer: Signer<'info>,

    pub system_program: Program<'info, System>,
}