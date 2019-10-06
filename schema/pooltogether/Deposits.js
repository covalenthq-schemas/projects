import {
    SPONSORSHIP_DEPOSITED,
    DEPOSITED,
    WITHDRAWN,
    CDAI_CONTRACT,
    PT_CONTRACT,
    PT_CONTRACT_RAW
} from "./constants";

cube(`Deposits`, {
    sql: `
select x.block_id, x.block_signed_at, x.tx_hash, x.amount, x.type, sender, price, data from (
    select
        block_id,
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
        block_id,
        block_signed_at,
        '0x' || encode(tx_hash, 'hex') as "tx_hash",
        '0x'|| encode(substr(topics[2], 13), 'hex') as "sender",
        hex_to_int( encode(data, 'hex')) * 1e-18as "amount",
        'Sponsorship Deposited' as type
    
    from
        live.block_log_events e
      
    where
        e.topics[1] = '${SPONSORSHIP_DEPOSITED}'
        and e.sender = '${PT_CONTRACT}'  


    union

    select
        block_id,
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

    left join (
        select
        block_id,
        data 
        from batch.trace_sstore_events
        where account = '${CDAI_CONTRACT}'
        and key_path->1 = '"${PT_CONTRACT_RAW}"'
    ) y
    on y.block_id = x.block_id

    left join (
        select date, price from crawl.prices
        where base= 'USD' and symbol = 'CDAI'
    ) cdai_prices
    on date_trunc('day', x.block_signed_at) = cdai_prices.date
` ,

    measures: {
        count: {
            type: `count`,
            drillMembers: [Created, Player, Type, TxHash]
        },
        amount: {
            type: `sum`,
            sql: `amount`,
            format: `currency`
        },
        cdai_balance: {
            type: `avg`,
            sql: `data / 1e8`,
            format: `currency`,
            title: `cDAI balance`
        },
        cdai_balance_usd: {
            type: `avg`,
            sql: `data * price / 1e8`,
            format: `currency`,
            title: `cDAI balance (USD)`
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
    },
    preAggregations: {
        main_1: {
            type: `originalSql`
        }
    }
});
