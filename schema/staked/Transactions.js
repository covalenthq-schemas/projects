import { CRYPTO_EPOCH, TRANSFER_EVENT, RAY_TOKEN } from "./constants";

cube(`Transactions`, {
    sql: `
    select 
    block_signed_at,
    '0x' || encode(substr(topics[3], 13), 'hex') as to_address,
    '0x' || encode(data, 'hex') as value
    
    from live.block_log_events
    
    where topics[1] = '${TRANSFER_EVENT}'
    and  sender = '${RAY_TOKEN}'
    ` ,

    measures: {
        count: {
            type: `count`,
            drillMembers: []
        },
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
        toAddress: {
            sql: `to_address`,
            primaryKey: true,
            type: `string`
        },
        // LastSeenAt: {
        //     sql: `${CUBE}.last_seen_at`,
        //     type: `time`
        // }
    }
});
