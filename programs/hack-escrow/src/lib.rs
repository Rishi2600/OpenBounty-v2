mod error;
mod state;

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Token, TokenAccount, Transfer};
use sha2::{Digest, Sha256};
use state::{Bounty, Vault};

declare_id!("HackEscrow1111111111111111111111111111111");

const ESCROW_SEED: &[u8] = b"bounty_vault";
const BOUNTY_SEED: &[u8] = b"bounty_account";

#[program]
pub mod hack_escrow {
    use super::*;

    /// Initialize a new bounty with funds locked in vault
    pub fn initialize_bounty(
        ctx: Context<InitializeBounty>,
        bounty_id: String,
        amount: u64,
        secret_hash: [u8; 32],
        deadline: i64,
        recipient: Option<Pubkey>,
        title: String,
    ) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty;
        let clock = Clock::get()?;

        // Validate deadline is in the future
        require!(deadline > clock.unix_timestamp, EscrowError::NotExpired);

        // Validate amount
        require!(amount > 0, EscrowError::MathOverflow);

        // Get vault PDA
        let (vault, vault_bump) = Pubkey::find_program_address(
            &[ESCROW_SEED, ctx.accounts.organizer.key.as_ref(), bounty_id.as_bytes()],
            ctx.program_id,
        );

        // Initialize bounty account
        bounty.organizer = ctx.accounts.organizer.key();
        bounty.mint = ctx.accounts.mint.key();
        bounty.vault = vault;
        bounty.amount = amount;
        bounty.secret_hash = secret_hash;
        bounty.deadline = deadline;
        bounty.is_claimed = false;
        bounty.recipient = recipient;
        bounty.bump = ctx.bumps.bounty;
        bounty.vault_bump = vault_bump;
        bounty.title = title;
        bounty.created_at = clock.unix_timestamp;

        // Transfer funds from organizer to vault
        if ctx.accounts.mint.key() == anchor_lang::system_program::ID {
            // Native SOL transfer
            let cpi_context = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.organizer.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            );
            anchor_lang::system_program::transfer(cpi_context, amount)?;
        } else {
            // SPL Token transfer
            let cpi_context = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.organizer_token.to_account_info(),
                    to: ctx.accounts.vault_token.to_account_info(),
                    authority: ctx.accounts.organizer.to_account_info(),
                },
            );
            anchor_spl::token::transfer(cpi_context, amount)?;
        }

        msg!("Bounty initialized successfully: {}", bounty_id);
        Ok(())
    }

    /// Claim the bounty with the secret key
    pub fn claim_bounty(ctx: Context<ClaimBounty>, secret: Vec<u8>) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty;
        let clock = Clock::get()?;

        // Check if already claimed
        require!(!bounty.is_claimed, EscrowError::AlreadyClaimed);

        // Check if not expired
        require!(clock.unix_timestamp < bounty.deadline, EscrowError::BountyExpired);

        // Verify the secret
        let mut hasher = Sha256::new();
        hasher.update(&secret);
        let result = hasher.finalize();

        require!(
            result == bounty.secret_hash,
            EscrowError::InvalidSecret
        );

        // Check recipient if specified
        if let Some(recipient) = &bounty.recipient {
            require!(
                *ctx.accounts.claimer.key == *recipient,
                EscrowError::Unauthorized
            );
        }

        // Mark as claimed
        bounty.is_claimed = true;

        // Transfer funds from vault to claimer
        if bounty.mint.is_none() || bounty.mint == Some(anchor_lang::system_program::ID) {
            // Native SOL transfer
            let vault_balance = ctx.accounts.vault.lamports();
            **ctx.accounts.vault.lamports.borrow_mut() -= vault_balance;
            **ctx.accounts.claimer.lamports.borrow_mut() += vault_balance;
        } else {
            // SPL Token transfer
            let vault_token_balance = ctx.accounts.vault_token.amount;
            let cpi_context = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token.to_account_info(),
                    to: ctx.accounts.claimer_token.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
            );
            anchor_spl::token::transfer(cpi_context, vault_token_balance)?;
        }

        msg!("Bounty claimed successfully by: {}", ctx.accounts.claimer.key());
        Ok(())
    }

    /// Refund the bounty to the organizer after expiration
    pub fn refund_bounty(ctx: Context<RefundBounty>) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty;
        let clock = Clock::get()?;

        // Check if already claimed
        require!(!bounty.is_claimed, EscrowError::AlreadyClaimed);

        // Check if expired
        require!(clock.unix_timestamp >= bounty.deadline, EscrowError::NotExpired);

        // Mark as claimed (to prevent further actions)
        bounty.is_claimed = true;

        // Transfer funds from vault to organizer
        if bounty.mint.is_none() || bounty.mint == Some(anchor_lang::system_program::ID) {
            // Native SOL transfer
            let vault_balance = ctx.accounts.vault.lamports();
            **ctx.accounts.vault.lamports.borrow_mut() -= vault_balance;
            **ctx.accounts.organizer.lamports.borrow_mut() += vault_balance;
        } else {
            // SPL Token transfer
            let vault_token_balance = ctx.accounts.vault_token.amount;
            let seeds = &[
                ESCROW_SEED,
                bounty.organizer.as_ref(),
                &ctx.accounts.bounty_id.as_bytes(),
                &[bounty.vault_bump],
            ];
            let signer = &[seeds];

            let cpi_context = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token.to_account_info(),
                    to: ctx.accounts.organizer_token.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                signer,
            );
            anchor_spl::token::transfer(cpi_context, vault_token_balance)?;
        }

        msg!("Bounty refunded successfully to: {}", bounty.organizer);
        Ok(())
    }

    /// Close the bounty account and return rent
    pub fn close_bounty(ctx: Context<CloseBounty>) -> Result<()> {
        let bounty = &ctx.accounts.bounty;

        // Only organizer can close
        require!(
            *ctx.accounts.authority.key == bounty.organizer,
            EscrowError::Unauthorized
        );

        // Close the account
        let dest = &ctx.accounts.destination;
        let bounty_info = &ctx.accounts.bounty;

        **dest.lamports.borrow_mut() += bounty_info.lamports();
        bounty_info.lamports.write_all(&[])?;

        msg!("Bounty account closed");
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(bounty_id: String)]
pub struct InitializeBounty<'info> {
    #[account(
        init,
        payer = organizer,
        space = Bounty::MAX_SIZE,
        seeds = [BOUNTY_SEED, organizer.key.as_ref(), bounty_id.as_bytes()],
        bump
    )]
    pub bounty: Account<'info, Bounty>,

    #[account(
        seeds = [ESCROW_SEED, organizer.key.as_ref(), bounty_id.as_bytes()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        init_if_needed,
        associated_token::mint = mint,
        associated_token::authority = vault,
        payer = organizer
    )]
    pub vault_token: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        associated_token::mint = mint,
        associated_token::authority = organizer,
        payer = organizer
    )]
    pub organizer_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub organizer: Signer<'info>,

    pub mint: Account<'info, anchor_spl::token::Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct ClaimBounty<'info> {
    #[account(
        mut,
        seeds = [BOUNTY_SEED, bounty.organizer.as_ref(), bounty_id.as_bytes()],
        bump = bounty.bump,
        constraint = !bounty.is_claimed @ EscrowError::AlreadyClaimed
    )]
    pub bounty: Account<'info, Bounty>,

    #[account(
        seeds = [ESCROW_SEED, bounty.organizer.as_ref(), bounty_id.as_bytes()],
        bump = bounty.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault,
    )]
    pub vault_token: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        associated_token::mint = mint,
        associated_token::authority = claimer,
        payer = claimer
    )]
    pub claimer_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub claimer: Signer<'info>,

    pub mint: Account<'info, anchor_spl::token::Mint>,

    #[account(address = anchor_lang::system_program::ID)]
    /// CHECK: This is the system program
    pub system_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// CHECK: Bounty ID stored in account
    pub bounty_id: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct RefundBounty<'info> {
    #[account(
        mut,
        seeds = [BOUNTY_SEED, bounty.organizer.as_ref(), bounty_id.as_bytes()],
        bump = bounty.bump,
        constraint = !bounty.is_claimed @ EscrowError::AlreadyClaimed
    )]
    pub bounty: Account<'info, Bounty>,

    #[account(
        seeds = [ESCROW_SEED, bounty.organizer.as_ref(), bounty_id.as_bytes()],
        bump = bounty.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = vault,
    )]
    pub vault_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = organizer,
    )]
    pub organizer_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub organizer: Signer<'info>,

    pub mint: Account<'info, anchor_spl::token::Mint>,

    #[account(address = anchor_lang::system_program::ID)]
    /// CHECK: This is the system program
    pub system_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// CHECK: Bounty ID stored in account
    pub bounty_id: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct CloseBounty<'info> {
    #[account(
        mut,
        constraint = bounty.is_claimed @ EscrowError::AlreadyClaimed,
        close = destination
    )]
    pub bounty: Account<'info, Bounty>,

    #[account(mut)]
    pub destination: SystemAccount<'info>,

    pub authority: Signer<'info>,
}
