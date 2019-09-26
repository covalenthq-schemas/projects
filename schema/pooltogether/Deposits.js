import { DEPOSITED, WITHDRAWN, PT_CONTRACT } from "./constants";

cube(`Deposits`, {
    sql: `
select * from (
    select
        block_signed_at,
        '0x' || encode(tx_hash, 'hex') as "tx_hash",
        '0x'|| encode(substr(topics[2], 13), 'hex') as "sender",
        hex_to_int( encode(data, 'hex')) * 1e-18as "amount",
        'Deposited' as type
    
    from
        live.block_log_events e
      
    where
        e.topics[1] = '${DEPOSITED}'
        and e.sender = '${PT_CONTRACT}'  

    union

    select
        block_signed_at,
        '0x' || encode(tx_hash, 'hex') as "tx_hash",
        '0x'|| encode(substr(topics[2], 13), 'hex') as "sender",
        -1 * hex_to_int( encode(data, 'hex')) * 1e-18 as "amount",
        'Withdrawn' as type

    from
        live.block_log_events e

    where
        e.topics[1] = '${WITHDRAWN}'
        and e.sender = '${PT_CONTRACT}'  
    ) x
` ,

    measures: {
        count: {
            type: `count`,
            drillMembers: [Created, Player, Type, TxHash]
        },
        amount: {
            type: `sum`,
            sql: `amount`
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
        Player: {
            sql: `${CUBE}."sender"`,
            type: `string`
        },
        Type: {
            sql: `${CUBE}.type`,
            type: `string`
        },
        TxHash: {
            sql: `'https://etherscan.io/tx/' || ${CUBE}.tx_hash`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        }
    }
});
