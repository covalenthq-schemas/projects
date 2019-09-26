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
select
  block_id,
  block_signed_at,
  block_height,
  '0x' || encode(tx_hash, 'hex') as "tx_hash",
  "tx_offset",
  "log_offset",
  bt.gas_offered, bt.gas_spent, bt.gas_price,
  '0x' || encode(substr(e.topics[2], 13), 'hex') as "logged_solidAccountOwner",
  '0x' || encode(substr(e.topics[3], 13), 'hex') as "logged_liquidAccountOwner"

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
left join
    (
        select hash, gas_offered, gas_spent, gas_price 
        from live.block_transactions 
    ) bt
on bt.hash = e.tx_hash

where
    e.topics[1] = '${LOG_LIQUIDATE_EVENT}'
    and e.sender = '${SOLO_CONTRACT}'  
` ,

    measures: {
        count: {
            type: `count`,
            // drillMembers: [Created, walletAddress, walletLink]
        },
        solidHeldUpdate_deltaWei: {
            sql: `logged_solidheldupdate_deltawei / (
                case
                    when logged_heldmarket = 0 then 1e18
                    when logged_heldmarket = 1 then 1e18
                    when logged_heldmarket = 2 then 1e6
                end
            )`,
            type: `sum`
        },
        // solidHeldUpdate_newPar: {
        //     sql: `logged_solidheldupdate_newpar`,
        //     type: `number`
        // },
        solidOwedUpdate_deltaWei: {
            sql: `logged_solidowedupdate_deltawei / (
                case
                    when logged_owedmarket = 0 then 1e18
                    when logged_owedmarket = 1 then 1e18
                    when logged_owedmarket = 2 then 1e6
                end
            )`,
            type: `sum`
        },
        // solidOwedUpdate_newPar: {
        //     sql: `logged_solidowedupdate_newpar`,
        //     type: `number`
        // }
        liquidHeldUpdate_deltaWei: {
            sql: `logged_liquidheldupdate_deltawei / (
                case
                    when logged_heldmarket = 0 then 1e18
                    when logged_heldmarket = 1 then 1e18
                    when logged_heldmarket = 2 then 1e6
                end
            )`,
            type: `sum`
        },
        // liquidHeldUpdate_newPar: {
        //     sql: `logged_liquidheldupdate_newpar`,
        //     type: `number`
        // },

        liquidOwedUpdate_deltaWei: {
            sql: `logged_liquidowedupdate_deltawei / (
                case
                    when logged_owedmarket = 0 then 1e18
                    when logged_owedmarket = 1 then 1e18
                    when logged_owedmarket = 2 then 1e6
                end
            )`,
            type: `sum`
        },
        // liquidOwedUpdate_newPar: {
        //     sql: `logged_liquidowedupdate_newpar`,
        //     type: `number`
        // }
        marketExchangeRate: {
            sql: `case when ${liquidHeldUpdate_deltaWei} = 0 then 0 else ${solidOwedUpdate_deltaWei} / ${liquidHeldUpdate_deltaWei} * 1.05 end`,
            type: `number`,
            format: `currency`
        },
        fees: {
            sql: `case when ${liquidHeldUpdate_deltaWei} = 0 then 0 else ${liquidHeldUpdate_deltaWei} * ((${solidOwedUpdate_deltaWei} / ${liquidHeldUpdate_deltaWei} * 1.05) - (${solidOwedUpdate_deltaWei} / ${liquidHeldUpdate_deltaWei})) end`,
            type: `number`,
            format: `currency`
        },
        TransactionCost_Eth: {
            sql: `gas_spent * gas_price / 1e18`,
            type: `sum`,
            title: `Transaction Cost (in ETH)`
        },
        gasSpent: {
            sql: `gas_spent`,
            type: `sum`
        },
        gasPrice: {
            sql: `gas_price`,
            type: `sum`
        },
        roi: {
            sql: `${fees} / ${solidOwedUpdate_deltaWei} `,
            type: `number`,
            format: `percent`
        }
    },
    dimensions: {
        blockId: {
            sql: `block_id`,
            type: `number`,
            primaryKey: true
        },
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
            type: `string`
        },
        solidAccountOwnerLink: {
            sql: `'https://etherscan.io/address/' || "logged_solidAccountOwner"`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        },
        liquidAccountOwner: {
            sql: `"logged_liquidAccountOwner"`,
            type: `string`
        },
        liquidAccountOwnerLink: {
            sql: `'https://etherscan.io/address/' || "logged_liquidAccountOwner"`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        },
        solidAccountNumber: {
            sql: `logged_solidAccountNumber`,
            type: `string`
        },
        liquidAccountNumber: {
            sql: `logged_liquidAccountNumber`,
            type: `string`
        },
        heldMarket: {
            // sql: `logged_heldmarket`,
            type: `string`,
            case: {
                when: [
                    { sql: `logged_heldmarket = 0`, label: `WETH` },
                    { sql: `logged_heldmarket = 1`, label: `DAI` },
                    { sql: `logged_heldmarket = 2`, label: `USDC` }
                ]
            }
        },
        owedMarket: {
            // sql: `logged_owedmarket`,
            type: `string`,
            case: {
                when: [
                    { sql: `logged_owedmarket = 0`, label: `WETH` },
                    { sql: `logged_owedmarket = 1`, label: `DAI` },
                    { sql: `logged_owedmarket = 2`, label: `USDC` }
                ]
            }
        }
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }    
});
