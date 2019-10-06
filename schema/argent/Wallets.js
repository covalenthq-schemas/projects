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
    '0x' || substr(substr(encode(e.data, 'hex'), 1+(64*0), 64), 25) as "logged_wallet",
    substr(e.data, 13, 20) as "logged_wallet_raw",
    '0x' || substr(substr(encode(e.data, 'hex'), 1+(64*1), 64), 25) as "logged_authorizedaddress",
    hex_to_int(substr(encode(e.data, 'hex'), 1+(64*2))) as "logged_full",
    data as log_data
from
    live.block_log_events e
where
    e.topics[1] = '${WALLET_CREATED}'
    and e.sender = '${FACTORY}'  
    `,
    joins: {
        CompoundDai: {
            relationship: `hasOne`,
            sql: `('"' || encode(substr(log_data, 13, 20), 'hex') || '"')::jsonb = ${CompoundDai}.key_path and ${CompoundDai}.rn = 1`
        },
        DaiBalance: {
            relationship: `hasOne`,
            sql: `('"' || encode(substr(log_data, 13, 20), 'hex') || '"')::jsonb = ${DaiBalance}.key_path and ${DaiBalance}.rn = 1`
        },
        EthBalance: {
            relationship: `hasOne`,
            sql: `${Wallets}.logged_wallet_raw = ${EthBalance}.account AND ${EthBalance}.rn = 1`
        },
        UserTransactions: {
            relationship: `hasMany`,
            sql: `${UserTransactions}.to_address = ${Wallets}.logged_wallet`
        },
    },
    measures: {
        count: {
            type: `count`,
            drillMembers: [Created, walletAddress, walletLink]
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
            sql: `logged_wallet`,
            type: `string`
        },
        walletLink: {
            sql: `'https://etherscan.io/address/' || logged_wallet`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        },
        full: {
            sql: `logged_full`,
            type: `number`
        }
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }
});
