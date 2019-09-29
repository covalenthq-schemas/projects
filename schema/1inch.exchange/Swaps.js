import { ONEINCH_CONTRACT, SWAPPED_EVENT } from "./constants";

// take 0xa35fc5019c4dc509394bd4d74591a0bf8852c195 as example
// underlying set 0x2e83ba9b863e0b4fd0cc377e5a9106c384fd79ac
// components 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599, 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2 

// 2 - supply
// 20, 14 - underlying set 
// 12 - natural unit
// 15 - units for rebalancing
// 8 - units for static
const BLOCK_ID_START = 1390900854189650515;

cube('Swaps', {
    sql: `

    select
    block_id,
    block_signed_at,
    block_height,
    '0x' || encode(tx_hash, 'hex') as "tx_hash",

    '0x' || substr(encode(e.topics[2], 'hex'), 25) as "fromtoken",
    '0x' || substr(encode(e.topics[3], 'hex'), 25) as "totoken",
    '0x' || substr(encode(e.topics[4], 'hex'), 25) as "referrer",
    
    hex_to_int(substr(encode(data, 'hex'), 1+(64*0), 64)) as logged_fromamount,
    hex_to_int(substr(encode(data, 'hex'), 1+(64*1), 64)) as logged_toamount,
    hex_to_int(substr(encode(data, 'hex'), 1+(64*2), 64)) as logged_referrerfee,
    hex_to_int(substr(encode(data, 'hex'), 1+(64*3), 64)) as logged_fee

from
    live.block_log_events e

where
    e.topics[1] = '${SWAPPED_EVENT}'
    and e.sender = '${ONEINCH_CONTRACT}'  

    `,
    measures: {
        count: {
            type: `count`,
        },
        fromAmount: {
            type: `sum`,
            sql: `logged_fromamount`
        },
        toAmount: {
            type: `sum`,
            sql: `logged_toamount`
        },
        referrerFee: {
            type: `sum`,
            sql: `logged_referrerfee`
        },
        fee: {
            sql: `logged_fee`,
            type: `sum`
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
        fromToken: {
            sql: `fromtoken`,
            type: `string`
        },
        toToken: {
            sql: `totoken`,
            type: `string`
        },
        referrer: {
            sql: `referrer`,
            type: `string`
        },
        TxHash: {
            sql: `tx_hash`,
            type: `string`
        }
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }    
});
