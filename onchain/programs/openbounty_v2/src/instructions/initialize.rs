use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::error::EscrowError;
use crate::state::{Escrow, PrizeTier};

/// Initialize a new bounty escrow
///
/// This instruction:
/// 1. Validates title and metadata_uri
/// 2. Creates the escrow account with metadata
/// 3. Creates a vault PDA to hold the locked funds
/// 4. Transfers the total bounty amount from organizer to vault
/// 5. Stores title, metadata_uri, judges, threshold, tiers, and deadline
pub fn initialize_escrow(
    ctx: Context<InitializeEscrow>,
    title: String,
    metadata_uri: String,
    judges: Vec<Pubkey>,
    threshold: u8,
    tier_amounts: Vec<u64>,
    deadline: i64,
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;

    // Validate title — required, max 50 chars
    require!(
        !title.is_empty() && title.len() <= 50,
        EscrowError::InvalidTitle
    );

    // Validate metadata_uri — optional, max 100 chars
    // Empty string is valid (organizer may not provide metadata)
    require!(
        metadata_uri.len() <= 100,
        EscrowError::InvalidMetadataUri
    );

    // Existing validations — unchanged
    require!(!judges.is_empty(), EscrowError::NoJudges);
    require!(!tier_amounts.is_empty(), EscrowError::NoTiers);
    require!(
        threshold > 0 && threshold <= judges.len() as u8,
        EscrowError::InvalidThreshold
    );
    require!(deadline > clock.unix_timestamp, EscrowError::InvalidDeadline);

    // Calculate total amount needed
    let total_amount: u64 = tier_amounts.iter().sum();
    require!(total_amount > 0, EscrowError::InvalidAmount);

    // Transfer funds from organizer to vault
    let transfer_accounts = Transfer {
        from: ctx.accounts.organizer.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
    };
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        transfer_accounts,
    );
    transfer(cpi_context, total_amount)?;

    // Initialize prize tiers
    let prize_tiers: Vec<PrizeTier> = tier_amounts
        .iter()
        .map(|&amount| PrizeTier {
            amount,
            winner: None,
            claimed: false,
        })
        .collect();

    // Store escrow data
    escrow.title = title;
    escrow.metadata_uri = metadata_uri;
    escrow.organizer = ctx.accounts.organizer.key();
    escrow.judges = judges;
    escrow.threshold = threshold;
    escrow.tiers = prize_tiers;
    escrow.deadline = deadline;
    escrow.bump = ctx.bumps.escrow;
    escrow.vault_bump = ctx.bumps.vault;

    msg!("Escrow initialized!");
    msg!("Title: {}", escrow.title);
    msg!("Metadata URI: {}", escrow.metadata_uri);
    msg!("Organizer: {}", escrow.organizer);
    msg!("Total amount locked: {} lamports", total_amount);
    msg!("Number of judges: {}", escrow.judges.len());
    msg!("Threshold: {}", escrow.threshold);
    msg!("Number of tiers: {}", escrow.tiers.len());
    msg!("Deadline: {}", escrow.deadline);

    Ok(())
}

#[derive(Accounts)]
#[instruction(title: String, metadata_uri: String)]
pub struct InitializeEscrow<'info> {
    /// Escrow account that stores all metadata
    #[account(
        init,
        payer = organizer,
        space = Escrow::LEN,
        seeds = [b"escrow", organizer.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    /// Vault account that holds the locked SOL
    /// CHECK: This is a PDA that will receive SOL
    #[account(
        mut,
        seeds = [b"vault", organizer.key().as_ref()],
        bump
    )]
    pub vault: AccountInfo<'info>,

    /// Organizer who is creating the bounty
    #[account(mut)]
    pub organizer: Signer<'info>,

    /// System program for account creation and transfers
    pub system_program: Program<'info, System>,
}