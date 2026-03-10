use anchor_lang::prelude::*;

declare_id!("CdWRw7fqNCBpz34qHoFjua9Nry6pbhnVrsfpgMemKKrL");

#[program]
pub mod openbounty_v2 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
