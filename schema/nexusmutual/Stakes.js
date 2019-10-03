import { TOKEN_FUNCTIONS_CONTRACT, LOCKED_EVENT } from "./constants";

cube(`Stakes`, {
    sql: `

select
    block_id,
    block_signed_at,
    block_height,
    '0x' || encode(tx_hash, 'hex') as "tx_hash",
    '0x' || substr(encode(e.topics[2], 'hex'), 25) as "logged_of"
    , '0x' || encode(e.topics[3], 'hex') as "logged_reason"
    , hex_to_int(substr(encode(e.data,'hex'), 1+(64*0), 64)) as "logged_amount"
    , to_timestamp(hex_to_int(substr(encode(e.data,'hex'), 1+(64*1),64))) as "logged_validity"

from
    live.block_log_events e

where
    e.topics[1] = '${LOCKED_EVENT}'
    and e.sender = '${TOKEN_FUNCTIONS_CONTRACT}'  
` ,

    measures: {
        count: {
            type: `count`,
            // drillMembers: [Created, walletAddress, walletLink]
        },
        // growth_rate: {
        //     type: `number`,
        //     format: `percent`,
        //     sql: `coalesce(  (${count} * 1.0 / lag(nullif( ${count}, 0) , 1) over ()) - 1.0 , 0)`
        // },
        Amount: {
            sql: `logged_amount / 1e18`,
            type: `sum`,
            format: `currency`
        },
        AmountQuote: {
            sql: `0`,
            type: `number`,
            format: `currency`
        },
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
        coverId: {
            sql: `logged_cid`,
            type: `number`
        },
        TxHashLink: {
            sql: `'https://etherscan.io/tx/' || "tx_hash"`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        },
        SmartContract: {
            sql: `logged_reason`,
            type: `string`
        },
        expiry: {
            sql: `logged_expiry`,
            type: `string`
        }
    },
    // preAggregations: {
    //     main: {
    //         type: `originalSql`
    //     }
    // }
});
