import { OPENED, REWARDED, COMMITTED, PT_CONTRACT } from "./constants";

cube(`Draws`, {
    sql: `


    select 
        base.block_signed_at,
        base.drawid, 
        base.logged_feebeneficiary,
        base.feefraction,
        base.tx_hash,
        rewarded.winner,
        rewarded.winnings,
        rewarded.fee,
        committed.block_signed_at as committed_block_signed_at,
        case 
            when committed.block_signed_at is null then 'LIVE'
            when rewarded.block_signed_at is not null then 'REWARDED'
            else 'COMMITTED'
        end
        as status
    from (
    select
    block_signed_at,
    hex_to_int(encode(topics[2], 'hex')) as drawid,
    '0x' || substr(encode(topics[3], 'hex'), 25) as logged_feebeneficiary,
    encode(topics[5], 'hex') as feefraction,
    '0x' || encode(tx_hash, 'hex') as tx_hash
    from
    live.block_log_events e

    where
    e.topics[1] = '${OPENED}'
    and e.sender = '${PT_CONTRACT}'  
  
) base

left join
(
    select block_signed_at, 
    hex_to_int(encode(e.topics[2], 'hex')) as drawid
    from live.block_log_events e
    where 
    e.topics[1] = '${COMMITTED}'
) committed
on committed.drawid = base.drawid

left join
(
    select
        hex_to_int(encode(topics[2], 'hex')) as drawid,
        block_signed_at,
        '0x' || encode(topics[3], 'hex') as winner
        , hex_to_int(substr(encode(data, 'hex'), 1+(64*1), 64)) as winnings
        , hex_to_int(substr(encode(data, 'hex'), 1+(64*2), 64)) as fee
    from live.block_log_events

    where topics[1] = '${REWARDED}'

) rewarded
on rewarded.drawid = base.drawid

` ,
    measures: {
        count: {
            type: `count`,
        },
        winnings: {
            type: `sum`,
            format: `currency`,
            sql: `winnings / 1e18`
        },
        fee: {
            type: `sum`,
            format: `currency`,
            sql: `fee / 1e18`
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
        drawId: {
            sql: `${CUBE}."drawid"`,
            type: `string`
        },
        TxHashLink: {
            sql: `'https://etherscan.io/tx/' || "tx_hash"`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        },
        feeBeneficiary: {
            sql: `logged_feebeneficiary`,
            type: `string`
        },
        winner: {
            sql: `logger_winner`,
            type: `string`
        },
        status: {
            sql: `status`,
            type: `string`
        }

    }
});
