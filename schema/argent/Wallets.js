import { WALLET_CREATED, FACTORY } from "./constants";

cube(`Wallets`, {
    sql: `
select
    block_id,
    block_signed_at,
    block_height,
    '0x' || encode(tx_hash, 'hex') as "tx_hash",
    "tx_offset",
    "log_offset",
    '0x' || substr(encode(e.topics[1], 'hex'), 25) as "logged_sender",
    '0x' || substr(encode(e.topics[2], 'hex'), 25) as "logged_owner",
    '0x' || substr(encode(e.data, 'hex'), 25) as "logged_proxy"
from
    live.block_log_events e
where
    e.topics[1] = '${WALLET_CREATED}'
    and e.sender = '${FACTORY}'  
    `,
    measures: {
        count: {
            type: `count`
        },
        eth_balance_Todo: {
            type: `sum`,
            sql: `0`,
            format: "currency",
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
        walletAddress: {
            sql: `logged_proxy`,
            type: `string`
        }
    }
});
