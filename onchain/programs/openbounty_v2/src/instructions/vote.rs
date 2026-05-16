use anchor_lang::prelude::*;
use crate::error::EscrowError;
use crate::state::{Escrow, TierVote};

/// Vote for a winner on a specific prize tier
///
/// Called by each judge individually. When enough judges vote for the
/// same candidate (>= threshold), the tier is automatically finalized
/// and tier.winner is set. No off-chain coordination needed.
///
/// Rules enforced:
/// - Signer must be in escrow.judges
/// - Tier index must be valid
/// - Tier must not already be finalized
/// - This judge must not have already voted on this tier
/// - Escrow must not be expired (deadline passed)
pub fn vote_winner(
    ctx: Context<VoteWinner>,
    nonce: u8,
    tier: u8,
    candidate: Pubkey,
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let judge  = ctx.accounts.judge.key();
    let clock  = Clock::get()?;

    // Escrow must not be past deadline
    require!(
        clock.unix_timestamp <= escrow.deadline,
        EscrowError::EscrowExpired
    );

    // Signer must be in the judge list
    require!(
        escrow.judges.contains(&judge),
        EscrowError::NotAJudge
    );

    // Tier index must be valid
    let tier_index = tier as usize;
    require!(tier_index < escrow.tiers.len(), EscrowError::InvalidTier);

    // Tier must not already be finalized
    require!(
        escrow.tiers[tier_index].winner.is_none(),
        EscrowError::TierAlreadyFinalized
    );

    // This judge must not have already voted on this tier
    let already_voted = escrow.tiers[tier_index]
        .votes
        .iter()
        .any(|v| v.judge == judge);
    require!(!already_voted, EscrowError::AlreadyVoted);

    // Record the vote
    escrow.tiers[tier_index].votes.push(TierVote {
        judge,
        candidate,
    });

    msg!(
        "Vote recorded — judge: {}, tier: {}, candidate: {}",
        judge, tier, candidate
    );

    // Count votes for this candidate on this tier
    let vote_count = escrow.tiers[tier_index]
        .votes
        .iter()
        .filter(|v| v.candidate == candidate)
        .count() as u8;

    msg!(
        "Vote tally for candidate {} on tier {}: {}/{}",
        candidate, tier, vote_count, escrow.threshold
    );

    // Auto-finalize if threshold reached
    if vote_count >= escrow.threshold {
        escrow.tiers[tier_index].winner = Some(candidate);
        msg!(
            "Tier {} finalized — winner: {}",
            tier, candidate
        );
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(nonce: u8, tier: u8, candidate: Pubkey)]
pub struct VoteWinner<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.organizer.as_ref(), &[nonce]],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,

    /// The judge casting this vote — must be in escrow.judges
    #[account(mut)]
    pub judge: Signer<'info>,
}