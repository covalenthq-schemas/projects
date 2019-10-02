import { LOG_MAKER_TO_COMPOUND, LOG_COMPOUND_TO_MAKER, INSTADAPP_BRIDGE } from "./constants";

cube(`InstaBridge`, {

    sql: `
with prices as (
    select symbol, date, price from crawl.prices
    where base = 'USD' and symbol in ('DAI', 'ETH')
)    
    
select
    block_id,
    block_signed_at,
    block_height,
    '0x' || encode(tx_hash, 'hex') as tx_hash,
    pe.price as eth_price,
    pd.price as dai_price,
    case 
        when e.topics[1] = '${LOG_MAKER_TO_COMPOUND}' then 'Maker->Compound'
        else 'Compound->Maker'
    end as direction        

    , hex_to_int(substr(encode(e.data,'hex'), 1+(64*0), 64)) as "cdpnum"
    , hex_to_int(substr(encode(e.data,'hex'), 1+(64*1), 64)) as "ethamt"
    , hex_to_int(substr(encode(e.data,'hex'), 1+(64*2), 64)) as "daiamt"
    , hex_to_int(substr(encode(e.data,'hex'), 1+(64*3), 64)) as "fees"
    , substr(substr(encode(e.data,'hex'), 1+(64*4), 64), 24) as "owner"

from
    live.block_log_events e

left join prices pe
on pe.symbol = 'ETH' and date_trunc('day', e.block_signed_at) = pe.date

left join prices pd
on pd.symbol = 'DAI' and date_trunc('day', e.block_signed_at) = pd.date

where
    e.topics[1] in ('${LOG_MAKER_TO_COMPOUND}', '${LOG_COMPOUND_TO_MAKER}')
    and e.sender = '${INSTADAPP_BRIDGE}'  

    `,
    measures: {
        count: {
            type: `count`,
        },
        ethAmount: {
            type: `sum`,
            format: `currency`,
            sql: `ethAmt / 1e18`
        },
        ethAmountUsd: {
            type: `sum`,
            format: `currency`,
            sql: `ethAmt * eth_price / 1e18`,
            title: `ETH Amount (USD)`
        },
        daiAmount: {
            type: `sum`,
            format: `currency`,
            sql: `daiAmt / 1e18`
        },
        daiAmountUsd: {
            type: `sum`,
            format: `currency`,
            sql: `daiAmt * dai_price / 1e18`,
            title: `DAI Amount (USD)`
        },        
        fees: {
            type: `sum`,
            format: `currency`,
            sql: `fees`
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
        direction: {
            type: `string`,
            sql: `direction`
        },
        cdp: {
            type: `number`,
            sql: `cdpnum`
        },
        owner: {
            type: `string`,
            sql: `'0x' || owner`
        },
        TxHashLink: {
            sql: `'https://etherscan.io/tx/' || "tx_hash"`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        },

    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }
})
