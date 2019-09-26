import { GNOSIS_FACTORY, CONTRACT_INSTANTIATION } from "./constants";

cube(`Safes`, {
    sql: `
select
    block_id,
    block_signed_at,
    block_height,
    '0x' || encode(tx_hash, 'hex') as "tx_hash",
    "tx_offset",
    "log_offset",
    e.data as "log_data",   
    '0x' || encode(substr(e.data, 13, 20), 'hex') as "logged_sender",
    substr(e.data, 45, 20) as "logged_instantiation_raw",
    '0x' || encode(substr(e.data, 45, 20), 'hex') as "logged_instantiation"

from
    live.block_log_events e

where
    e.topics[1] = '${CONTRACT_INSTANTIATION}'
    and e.sender = '${GNOSIS_FACTORY}'  
` ,
    joins: {
        EthBalance: {
            relationship: `hasOne`,
            sql: `${Safes}.logged_instantiation_raw = ${EthBalance}.account AND ${EthBalance}.rn = 1`
        },
        DaiBalance: {
            relationship: `hasOne`,
            sql: `('"' || encode(${Safes}.logged_instantiation_raw, 'hex') || '"')::jsonb = ${DaiBalance}.key_path AND ${DaiBalance}.rn = 1`
        },
        GnoBalance: {
            relationship: `hasOne`,
            sql: `('"' || encode(${Safes}.logged_instantiation_raw, 'hex') || '"')::jsonb = ${GnoBalance}.key_path AND ${GnoBalance}.rn = 1`
        }
    },
    measures: {
        count: {
            type: `count`,
            drillMembers: [Created, instantiationAddress, instantiationAddressLink]
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
        instantiationAddress: {
            sql: `logged_instantiation`,
            type: `string`
        },
        instantiationAddressLink: {
            sql: `'https://etherscan.io/address/' || logged_instantiation`,
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
