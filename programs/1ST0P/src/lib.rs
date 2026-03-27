use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, SetAuthority, Token, TokenAccount};

declare_id!("5VT57qmHnPuYJaaaXc2fzeywvL9hatirgPggndr1aydk");

/// 1 SOL to launch (paid to treasury).
pub const LAUNCH_FEE_LAMPORTS: u64 = 1_000_000_000;
/// ~1% is typical for launchpads (buy + sell).
pub const DEFAULT_FEE_BPS: u16 = 100;
/// Virtual SOL depth on the curve (pump.fun-style magnitude).
pub const VIRTUAL_SOL_LAMPORTS: u64 = 30_000_000_000;
/// Total supply minted into the curve vault at launch (1B tokens, 6 decimals).
pub const TOTAL_SUPPLY_RAW: u64 = 1_000_000_000 * 1_000_000;

#[program]
pub mod onestop {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee_bps: u16) -> Result<()> {
        require!(fee_bps <= 1_000, LaunchpadError::FeeTooHigh);
        let cfg = &mut ctx.accounts.global_config;
        cfg.authority = ctx.accounts.authority.key();
        cfg.treasury = ctx.accounts.treasury.key();
        cfg.fee_bps = fee_bps;
        cfg.bump = ctx.bumps.global_config;
        Ok(())
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_treasury: Option<Pubkey>,
        new_fee_bps: Option<u16>,
    ) -> Result<()> {
        let cfg = &mut ctx.accounts.global_config;
        if let Some(t) = new_treasury {
            cfg.treasury = t;
        }
        if let Some(bps) = new_fee_bps {
            require!(bps <= 1_000, LaunchpadError::FeeTooHigh);
            cfg.fee_bps = bps;
        }
        Ok(())
    }

    /// Creates a new SPL mint, funds the bonding vault with full supply, then revokes mint auth.
    /// Charges `LAUNCH_FEE_LAMPORTS` from `creator` to `treasury`.
    pub fn create_memecoin(
        ctx: Context<CreateMemecoin>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        require!(name.len() <= 32, LaunchpadError::NameTooLong);
        require!(symbol.len() <= 10, LaunchpadError::SymbolTooLong);
        require!(uri.len() <= 200, LaunchpadError::UriTooLong);

        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.creator.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            LAUNCH_FEE_LAMPORTS,
        )?;

        let clock = Clock::get()?;

        {
            let curve = &mut ctx.accounts.bonding_curve;
            curve.mint = ctx.accounts.mint.key();
            curve.creator = ctx.accounts.creator.key();
            curve.token_reserve = TOTAL_SUPPLY_RAW;
            curve.virtual_sol = VIRTUAL_SOL_LAMPORTS;
            curve.name = name;
            curve.symbol = symbol;
            curve.uri = uri;
            curve.created_at = clock.unix_timestamp;
            curve.bump = ctx.bumps.bonding_curve;
        }

        let mint_key = ctx.accounts.mint.key();
        let bump = ctx.bumps.bonding_curve;
        let seeds: &[&[u8]] = &[b"curve", mint_key.as_ref(), &[bump]];
        let signer = &[seeds];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.curve_token_account.to_account_info(),
                    authority: ctx.accounts.bonding_curve.to_account_info(),
                },
                signer,
            ),
            TOTAL_SUPPLY_RAW,
        )?;

        token::set_authority(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                SetAuthority {
                    current_authority: ctx.accounts.bonding_curve.to_account_info(),
                    account_or_mint: ctx.accounts.mint.to_account_info(),
                },
                signer,
            ),
            anchor_spl::token::spl_token::instruction::AuthorityType::MintTokens,
            None,
        )?;

        token::set_authority(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                SetAuthority {
                    current_authority: ctx.accounts.bonding_curve.to_account_info(),
                    account_or_mint: ctx.accounts.mint.to_account_info(),
                },
                signer,
            ),
            anchor_spl::token::spl_token::instruction::AuthorityType::FreezeAccount,
            None,
        )?;

        Ok(())
    }

    /// Buy curve tokens with SOL. `sol_in` is total SOL from buyer including fee taken first.
    pub fn buy(ctx: Context<Trade>, sol_in: u64, min_tokens_out: u64) -> Result<()> {
        require!(sol_in > 0, LaunchpadError::ZeroAmount);
        let cfg = &ctx.accounts.global_config;
        let fee = fee_amount(sol_in, cfg.fee_bps)?;
        let sol_to_curve = sol_in.checked_sub(fee).ok_or(LaunchpadError::MathOverflow)?;

        let mint_key = ctx.accounts.mint.key();
        let bump = ctx.accounts.bonding_curve.bump;
        let seeds: &[&[u8]] = &[b"curve", mint_key.as_ref(), &[bump]];
        let signer = &[seeds];

        let (tokens_out, new_reserve) = {
            let curve = &ctx.accounts.bonding_curve;
            let rent_min = Rent::get()?.minimum_balance(8 + BondingCurve::INIT_SPACE);
            let sol_balance = curve
                .to_account_info()
                .lamports()
                .saturating_sub(rent_min);
            curve_buy_math(curve.virtual_sol, sol_balance, curve.token_reserve, sol_to_curve)?
        };

        require!(tokens_out >= min_tokens_out, LaunchpadError::SlippageBuy);

        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            fee,
        )?;

        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.bonding_curve.to_account_info(),
                },
            ),
            sol_to_curve,
        )?;

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.curve_token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.bonding_curve.to_account_info(),
                },
                signer,
            ),
            tokens_out,
        )?;

        ctx.accounts.bonding_curve.token_reserve = new_reserve;
        Ok(())
    }

    /// Sell curve tokens for SOL. Fee applies to SOL output.
    pub fn sell(ctx: Context<Trade>, token_in: u64, min_sol_out: u64) -> Result<()> {
        require!(token_in > 0, LaunchpadError::ZeroAmount);

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.curve_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            token_in,
        )?;

        let cfg = &ctx.accounts.global_config;
        let (sol_out_before_fee, new_reserve) = {
            let curve = &mut ctx.accounts.bonding_curve;
            let rent_min = Rent::get()?.minimum_balance(8 + BondingCurve::INIT_SPACE);
            let sol_balance = curve
                .to_account_info()
                .lamports()
                .saturating_sub(rent_min);
            curve_sell_math(curve.virtual_sol, sol_balance, curve.token_reserve, token_in)?
        };

        let fee = fee_amount(sol_out_before_fee, cfg.fee_bps)?;
        let user_sol = sol_out_before_fee
            .checked_sub(fee)
            .ok_or(LaunchpadError::MathOverflow)?;
        require!(user_sol >= min_sol_out, LaunchpadError::SlippageSell);

        {
            let curve_ai = ctx.accounts.bonding_curve.to_account_info();
            let user_ai = ctx.accounts.user.to_account_info();
            let treasury_ai = ctx.accounts.treasury.to_account_info();
            let rent_min = Rent::get()?.minimum_balance(8 + BondingCurve::INIT_SPACE);
            let available = curve_ai
                .lamports()
                .checked_sub(rent_min)
                .ok_or(LaunchpadError::InsufficientSol)?;
            require!(
                available >= sol_out_before_fee,
                LaunchpadError::InsufficientSol
            );

            **curve_ai.try_borrow_mut_lamports()? = curve_ai
                .lamports()
                .checked_sub(sol_out_before_fee)
                .ok_or(LaunchpadError::InsufficientSol)?;
            **user_ai.try_borrow_mut_lamports()? = user_ai
                .lamports()
                .checked_add(user_sol)
                .ok_or(LaunchpadError::MathOverflow)?;
            **treasury_ai.try_borrow_mut_lamports()? = treasury_ai
                .lamports()
                .checked_add(fee)
                .ok_or(LaunchpadError::MathOverflow)?;
        }

        ctx.accounts.bonding_curve.token_reserve = new_reserve;
        Ok(())
    }
}

fn fee_amount(amount: u64, fee_bps: u16) -> Result<u64> {
    let num = (amount as u128)
        .checked_mul(fee_bps as u128)
        .ok_or(LaunchpadError::MathOverflow)?;
    Ok((num / 10_000) as u64)
}

fn curve_buy_math(
    virtual_sol: u64,
    real_sol: u64,
    token_reserve: u64,
    sol_in: u64,
) -> Result<(u64, u64)> {
    require!(token_reserve > 0, LaunchpadError::EmptyCurve);
    let r_sol = (virtual_sol as u128)
        .checked_add(real_sol as u128)
        .ok_or(LaunchpadError::MathOverflow)?;
    let r_tok = token_reserve as u128;
    let k = r_sol
        .checked_mul(r_tok)
        .ok_or(LaunchpadError::MathOverflow)?;

    let new_r_sol = r_sol
        .checked_add(sol_in as u128)
        .ok_or(LaunchpadError::MathOverflow)?;
    let new_r_tok = k.checked_div(new_r_sol).ok_or(LaunchpadError::MathOverflow)?;
    let tokens_out = (r_tok
        .checked_sub(new_r_tok)
        .ok_or(LaunchpadError::MathOverflow)?) as u64;
    let new_reserve = new_r_tok as u64;
    Ok((tokens_out, new_reserve))
}

fn curve_sell_math(
    virtual_sol: u64,
    real_sol: u64,
    token_reserve: u64,
    token_in: u64,
) -> Result<(u64, u64)> {
    require!(token_reserve > 0, LaunchpadError::EmptyCurve);
    let r_sol = (virtual_sol as u128)
        .checked_add(real_sol as u128)
        .ok_or(LaunchpadError::MathOverflow)?;
    let r_tok = token_reserve as u128;
    let k = r_sol.checked_mul(r_tok).ok_or(LaunchpadError::MathOverflow)?;

    let new_r_tok = r_tok
        .checked_add(token_in as u128)
        .ok_or(LaunchpadError::MathOverflow)?;
    let new_r_sol = k.checked_div(new_r_tok).ok_or(LaunchpadError::MathOverflow)?;
    let sol_out = (r_sol
        .checked_sub(new_r_sol)
        .ok_or(LaunchpadError::MathOverflow)?) as u64;
    let new_reserve = new_r_tok as u64;
    Ok((sol_out, new_reserve))
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: treasury receives fees
    pub treasury: UncheckedAccount<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + GlobalConfig::INIT_SPACE,
        seeds = [b"global"],
        bump,
    )]
    pub global_config: Box<Account<'info, GlobalConfig>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"global"],
        bump = global_config.bump,
        has_one = authority @ LaunchpadError::Unauthorized,
    )]
    pub global_config: Account<'info, GlobalConfig>,
}

#[derive(Accounts)]
pub struct CreateMemecoin<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        mut,
        seeds = [b"global"],
        bump = global_config.bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,
    /// CHECK: must match configured treasury
    #[account(mut, address = global_config.treasury @ LaunchpadError::BadTreasury)]
    pub treasury: UncheckedAccount<'info>,
    #[account(
        init,
        payer = creator,
        space = 8 + BondingCurve::INIT_SPACE,
        seeds = [b"curve", mint.key().as_ref()],
        bump,
    )]
    pub bonding_curve: Box<Account<'info, BondingCurve>>,
    #[account(
        init,
        payer = creator,
        mint::decimals = 6,
        mint::authority = bonding_curve,
        mint::freeze_authority = bonding_curve,
    )]
    pub mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        payer = creator,
        associated_token::mint = mint,
        associated_token::authority = bonding_curve,
    )]
    pub curve_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Trade<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        seeds = [b"global"],
        bump = global_config.bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,
    #[account(mut, address = global_config.treasury @ LaunchpadError::BadTreasury)]
    pub treasury: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [b"curve", mint.key().as_ref()],
        bump = bonding_curve.bump,
    )]
    pub bonding_curve: Account<'info, BondingCurve>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = curve_token_account.mint == mint.key(),
        constraint = curve_token_account.owner == bonding_curve.key(),
    )]
    pub curve_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct GlobalConfig {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub fee_bps: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct BondingCurve {
    pub mint: Pubkey,
    pub creator: Pubkey,
    pub token_reserve: u64,
    pub virtual_sol: u64,
    pub bump: u8,
    #[max_len(32)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    #[max_len(200)]
    pub uri: String,
    pub created_at: i64,
}

#[error_code]
pub enum LaunchpadError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Treasury mismatch")]
    BadTreasury,
    #[msg("Name too long")]
    NameTooLong,
    #[msg("Symbol too long")]
    SymbolTooLong,
    #[msg("Uri too long")]
    UriTooLong,
    #[msg("Fee too high (max 10%)")]
    FeeTooHigh,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Slippage: too few tokens out")]
    SlippageBuy,
    #[msg("Slippage: too little SOL out")]
    SlippageSell,
    #[msg("Zero amount")]
    ZeroAmount,
    #[msg("Curve depleted")]
    EmptyCurve,
    #[msg("Insufficient SOL in curve vault")]
    InsufficientSol,
}
