import { EVENT, SPORTX } from "./constants";

cube(`Events`, {
    sql: `
select
    block_id,
    block_signed_at,
    block_height,
    '0x' || encode(tx_hash, 'hex') as "tx_hash",
    "tx_offset",
    "log_offset",
    e.data as "log_data",
    '0x' || encode(substr(e.topics[4], 13), 'hex') as "logged_player"
 
from
    live.block_log_events e

where
    e.topics[1] = '${EVENT}'
    and e.sender = '${SPORTX}'  
` ,

    measures: {
        count: {
            type: `count`
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
        playerAddress: {
            sql: `logged_player`,
            type: `string`
        },
        playerLink: {
            sql: `'https://etherscan.io/address/' || logged_player`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        }
    }
});
