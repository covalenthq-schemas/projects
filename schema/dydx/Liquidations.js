import { LOG_LIQUIDATE_EVENT, SOLO_CONTRACT } from "./constants";

// Sure, so you mostly want to look at the 4 balance updates
// 2 accounts, and 2 assets. One BalanceUpdate for each account/asset pair
// solid is the liquidator account (the active one)
// liquid is the liquidated account (the one that was undercollateralized)
// held is the collateral asset (for example eth in the case of a liquidated long)
// owed is the borrowed asset (for example dai in the case of a liquidated long)
// you can verify these by matching them up with the heldMarket and owedMarket in LogLiquidate
// And then each BalanceUpdate will have a DeltaWei which shows you the exact balance change
// (the delta) for each account for each asset

cube(`DydxLiquidations`, {
    sql: `
--with prices as (
--    select symbol, date, price from crawl.prices
--    where base = 'USD' and symbol in ('ETH', 'WETH', 'DAI', 'USDC')
--)    
select block_signed_at, 
tx_hash,
gas_offered, gas_spent, gas_price,
logged_solidaccountowner, logged_liquidaccountowner, logged_solidaccountnumber,
logged_liquidaccountnumber, logged_heldmarket, logged_owedmarket, 
logged_solidheldupdate_deltawei, logged_solidowedupdate_deltawei / (
    case
        when logged_owedmarket = 0 then 1e18
        when logged_owedmarket = 1 then 1e18
        when logged_owedmarket = 2 then 1e6
    end
) as logged_solidowedupdate_deltawei, 
logged_liquidheldupdate_deltawei / (
    case
        when logged_heldmarket = 0 then 1e18
        when logged_heldmarket = 1 then 1e18
        when logged_heldmarket = 2 then 1e6
    end
) as logged_liquidheldupdate_deltawei, logged_liquidowedupdate_deltawei,
eth_price.price as eth_price,
held_price.price as held_price,
owed_price.price as owed_price
from (
select
  block_id,
  block_signed_at,
  block_height,
  '0x' || encode(tx_hash, 'hex') as "tx_hash",
  "tx_offset",
  "log_offset",
  bt.gas_offered, bt.gas_spent, bt.gas_price,
  '0x' || encode(substr(e.topics[2], 13), 'hex') as "logged_solidaccountowner",
  '0x' || encode(substr(e.topics[3], 13), 'hex') as "logged_liquidaccountowner"

  , hex_to_int(substr(encode(e.data,'hex'),1+(64*0),64)) as "logged_solidaccountnumber"
  , substr(encode(e.data,'hex'), 1+(64*1), 64) as "logged_liquidaccountnumber"
  , hex_to_int(substr(encode(e.data,'hex'), 1+(64*2), 64)) as "logged_heldmarket"
  , hex_to_int(substr(encode(e.data,'hex'),1+(64*3),64)) as "logged_owedmarket"
  
  , case 
    when hex_to_int(substr(encode(e.data,'hex'), 1+(64*4), 64)) = 1 then -1
    else 1
    end * 
   hex_to_int(substr(encode(e.data,'hex'), 1+(64*5), 64)) as "logged_solidheldupdate_deltawei"
  
  
   , case 
   when hex_to_int(substr(encode(e.data,'hex'), 1+(64*6), 64)) = 1 then -1
   else 1
   end * 
  hex_to_int(substr(encode(e.data,'hex'), 1+(64*7), 64)) as "logged_solidheldupdate_newpar"
  
  
  , case 
  when hex_to_int(substr(encode(e.data,'hex'), 1+(64*8), 64)) = 1 then -1
  else 1
  end * 
  hex_to_int(substr(encode(e.data,'hex'), 1+(64*9), 64)) as "logged_solidowedupdate_deltawei"
  
  
  , case 
  when hex_to_int(substr(encode(e.data,'hex'), 1+(64*10), 64)) = 1 then -1
  else 1
  end * 
  hex_to_int(substr(encode(e.data,'hex'), 1+(64*11), 64)) as "logged_solidowedupdate_newpar"
  
  --
  
  , case 
  when hex_to_int(substr(encode(e.data,'hex'), 1+(64*12), 64)) = 1 then -1
  else 1
  end * 
  hex_to_int(substr(encode(e.data,'hex'), 1+(64*13), 64)) as "logged_liquidheldupdate_deltawei"
  
  
  , case 
  when hex_to_int(substr(encode(e.data,'hex'), 1+(64*14), 64)) = 1 then -1
  else 1
  end * 
  hex_to_int(substr(encode(e.data,'hex'), 1+(64*15), 64)) as "logged_liquidheldupdate_newpar"
  
  --
  
  , case 
  when hex_to_int(substr(encode(e.data,'hex'), 1+(64*16), 64)) = 1 then -1
  else 1
  end * 
  hex_to_int(substr(encode(e.data,'hex'), 1+(64*17), 64)) as "logged_liquidowedupdate_deltawei"
  
  
  , case 
  when hex_to_int(substr(encode(e.data,'hex'), 1+(64*18), 64)) = 1 then -1
  else 1
  end * 
  hex_to_int(substr(encode(e.data,'hex'), 1+(64*19), 64)) as "logged_liquidowedupdate_newpar"
  
  --
 
from
  live.block_log_events e
left join (
    select hash, gas_offered, gas_spent, gas_price 
    from live.block_transactions 
) bt
on bt.hash = e.tx_hash

where
    e.topics[1] = '${LOG_LIQUIDATE_EVENT}'
    and e.sender = '${SOLO_CONTRACT}' 

) x

left join (
    select symbol, date, price from crawl.prices
    where base = 'USD' and symbol = 'ETH'
) eth_price
on eth_price.date = date_trunc('day', x.block_signed_at)


left join (
    select symbol, date, price from crawl.prices
    where base = 'USD' and symbol in ('WETH', 'DAI', 'USDC')  
) held_price
on held_price.symbol = case 
when logged_heldmarket = 0 then 'WETH'
when logged_heldmarket = 1 then 'DAI'
when logged_heldmarket = 2 then 'USDC'
end and held_price.date = date_trunc('day', x.block_signed_at)


left join (
    select symbol, date, price from crawl.prices
    where base = 'USD' and symbol in ('WETH', 'DAI', 'USDC')  
) owed_price
on owed_price.symbol = case 
when logged_owedmarket = 0 then 'WETH'
when logged_owedmarket = 1 then 'DAI'
when logged_owedmarket = 2 then 'USDC'
end and owed_price.date = date_trunc('day', x.block_signed_at)

-- left join prices eth_price
-- on eth_price.symbol = 'ETH' and eth_price.date = date_trunc('day', x.block_signed_at)

-- left join prices held_price
-- on held_price.symbol = case 
-- when logged_heldmarket = 0 then 'WETH'
-- when logged_heldmarket = 1 then 'DAI'
-- when logged_heldmarket = 2 then 'USDC'
-- end and held_price.date = date_trunc('day', x.block_signed_at)

-- left join prices owed_price
-- on owed_price.symbol = case 
-- when logged_owedmarket = 0 then 'WETH'
-- when logged_owedmarket = 1 then 'DAI'
-- when logged_owedmarket = 2 then 'USDC'
-- end and owed_price.date = date_trunc('day', x.block_signed_at)
 
` ,

    measures: {
        count: {
            type: `count`,
            // drillMembers: [Created, walletAddress, walletLink]
        },
        HeldPrice_USD: {
            sql: `held_price`,
            type: `avg`,
            format: `currency`,
            title: `Collateral Market price (USD)`
        },
        OwedPrice_USD: {
            sql: `owed_price`,
            type: `avg`,
            format: `currency`,
            title: `Borrowed Market price (USD)`
        },
        marketRate_ETH: {
            sql: `eth_price`,
            type: `avg`,
            format: `currency`,
            title: `ETH Market price (USD)`
        },
        solidHeldUpdate_deltaWei: {
            sql: `logged_solidheldupdate_deltawei / (
                case
                    when logged_heldmarket = 0 then 1e18
                    when logged_heldmarket = 1 then 1e18
                    when logged_heldmarket = 2 then 1e6
                end
            )`,
            type: `sum`,
            title: `Liquidator Collateral Δ Update`
        },
        // solidHeldUpdate_newPar: {
        //     sql: `logged_solidheldupdate_newpar`,
        //     type: `number`
        // },
        solidOwedUpdate_deltaWei: {
            sql: `logged_solidowedupdate_deltawei`,
            type: `sum`,
            title: `Liquidator Borrowed Δ Update`
        },

        liquidHeldUpdate_deltaWei: {
            sql: `logged_liquidheldupdate_deltawei`,
            type: `sum`,
            shown: false
        },

        // liquidOwedUpdate_deltaWei: {
        //     sql: `logged_liquidowedupdate_deltawei / (
        //         case
        //             when logged_owedmarket = 0 then 1e18
        //             when logged_owedmarket = 1 then 1e18
        //             when logged_owedmarket = 2 then 1e6
        //         end
        //     )`,
        //     type: `sum`
        // },
        feesToLiquidator: {
            sql: `case 
            when ${liquidHeldUpdate_deltaWei} = 0 then 0 
            else ${liquidHeldUpdate_deltaWei} * ((${solidOwedUpdate_deltaWei} / ${liquidHeldUpdate_deltaWei} * 1.05) - (${solidOwedUpdate_deltaWei} / ${liquidHeldUpdate_deltaWei})) end`,
            type: `number`,
            format: `currency`
        },
        TransactionCost_Eth: {
            sql: `gas_spent * gas_price / 1e18`,
            type: `sum`,
            title: `Transaction Cost (ETH)`,
            format: `currency`
        },
        TransactionCost_Usd: {
            sql: `eth_price * gas_spent * gas_price / 1e18`,
            type: `sum`,
            title: `Transaction Cost (USD)`,
            format: `currency`
        },
        gasSpent: {
            sql: `gas_spent`,
            type: `sum`
        },
        gasPrice: {
            sql: `gas_price / 1e9`,
            type: `sum`
        },
        profit: {
            sql: `(logged_liquidheldupdate_deltawei * held_price )
             - ( logged_solidowedupdate_deltawei * owed_price ) 
             - (eth_price * gas_spent * gas_price / 1e18)`,
            format: `currency`,
            type: `sum`,
            title: `Profit (USD)`,
        },
        roi: {
            sql: ` (  
-- numerator is profit
                (logged_liquidheldupdate_deltawei * held_price )
                - ( logged_solidowedupdate_deltawei * owed_price ) 
                - (eth_price * gas_spent * gas_price / 1e18)

            )  / 
            ( (logged_liquidheldupdate_deltawei * held_price) 
              - (eth_price * gas_spent * gas_price / 1e18)
             )`,
            type: `avg`,
            format: `percent`
        }
    },
    dimensions: {
        Created_date: {
            sql: `date_trunc('day', ${CUBE}.block_signed_at)`,
            type: `time`
        },
        Created_week: {
            sql: `date_trunc('week', ${CUBE}.block_signed_at)`,
            type: `time`
        },
        Created_month: {
            sql: `date_trunc('month', ${CUBE}.block_signed_at)`,
            type: `time`
        },
        Created: {
            sql: `${CUBE}.block_signed_at`,
            type: `time`
        },
        TxHashLink: {
            sql: `'https://etherscan.io/tx/' || "tx_hash"`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        },
        solidAccountOwner: {
            sql: `"logged_solidAccountOwner"`,
            type: `string`,
            title: `Liquidator Account Owner`
        },
        solidAccountOwnerLink: {
            sql: `'https://etherscan.io/address/' || "logged_solidAccountOwner"`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            },
            title: `Liquidator Account Owner Link`
        },
        liquidAccountOwner: {
            sql: `"logged_liquidAccountOwner"`,
            type: `string`,
            title: `Liquidatee Account Owner`
        },
        liquidAccountOwnerLink: {
            sql: `'https://etherscan.io/address/' || "logged_liquidAccountOwner"`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            },
            title: `Liquidatee Account Owner Link`
        },
        solidAccountNumber: {
            sql: `logged_solidAccountNumber`,
            type: `string`,
            shown: false
        },
        liquidAccountNumber: {
            sql: `logged_liquidAccountNumber`,
            type: `string`,
            shown: false
        },
        heldMarket: {
            type: `string`,
            case: {
                when: [
                    { sql: `logged_heldmarket = 0`, label: `WETH` },
                    { sql: `logged_heldmarket = 1`, label: `DAI` },
                    { sql: `logged_heldmarket = 2`, label: `USDC` }
                ]
            },
            title: `Collateral Type`
        },
        owedMarket: {
            type: `string`,
            case: {
                when: [
                    { sql: `logged_owedmarket = 0`, label: `WETH` },
                    { sql: `logged_owedmarket = 1`, label: `DAI` },
                    { sql: `logged_owedmarket = 2`, label: `USDC` }
                ]
            },
            title: `Borrowed Type`
        }
    },
    preAggregations: {
        main_1: {
            type: `originalSql`
        }
    }
});
