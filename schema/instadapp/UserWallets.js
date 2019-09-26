import { CREATED_EVENT, INSTADAPP_REGISTRY } from "./constants";

cube(`UserWallets`, {
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
    '0x' || substr(encode(e.data, 'hex'), 25) as "logged_proxy",
    e.data as "log_data"
 from
    live.block_log_events e
where
    e.topics[1] = '${CREATED_EVENT}'
    and e.sender = '${INSTADAPP_REGISTRY}'  
` ,

    joins: {
        UserTransactions: {
            relationship: `hasMany`,
            sql: `${UserTransactions}.to_address = ${UserWallets}.logged_proxy`
        },
        CompoundDai: {
            relationship: `hasOne`,
            sql: `('"' || encode(substr(log_data, 13), 'hex') || '"')::jsonb = ${CompoundDai}.key_path and ${CompoundDai}.rn = 1`
        },
        CompoundEth: {
            relationship: `hasOne`,
            sql: `('"' || encode(substr(log_data, 13), 'hex') || '"')::jsonb = ${CompoundEth}.key_path and ${CompoundEth}.rn = 1`
        },
        CompoundBat: {
            relationship: `hasOne`,
            sql: `('"' || encode(substr(log_data, 13), 'hex') || '"')::jsonb = ${CompoundBat}.key_path and ${CompoundBat}.rn = 1`
        },
        CompoundRep: {
            relationship: `hasOne`,
            sql: `('"' || encode(substr(log_data, 13), 'hex') || '"')::jsonb = ${CompoundRep}.key_path and ${CompoundRep}.rn = 1`
        },
        CompoundUsdc: {
            relationship: `hasOne`,
            sql: `('"' || encode(substr(log_data, 13), 'hex') || '"')::jsonb = ${CompoundUsdc}.key_path and ${CompoundUsdc}.rn = 1`
        },
        CompoundWbtc: {
            relationship: `hasOne`,
            sql: `('"' || encode(substr(log_data, 13), 'hex') || '"')::jsonb = ${CompoundWbtc}.key_path and ${CompoundWbtc}.rn = 1`
        },
        CompoundZrx: {
            relationship: `hasOne`,
            sql: `('"' || encode(substr(log_data, 13), 'hex') || '"')::jsonb = ${CompoundZrx}.key_path and ${CompoundZrx}.rn = 1`
        }
    },

    measures: {
        count: {
            type: `count`,
            drillMembers: [Created, walletAddress, walletLink]
        },
        growth_rate: {
            type: `number`,
            format: `percent`,
            sql: `coalesce(  (${count} * 1.0 / lag(nullif( ${count}, 0) , 1) over ()) - 1.0 , 0)`
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
        },
        walletLink: {
            sql: `'https://etherscan.io/address/' || logged_proxy`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        }
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }
});
