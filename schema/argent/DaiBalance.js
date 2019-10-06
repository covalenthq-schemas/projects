import { DAI_CONTRACT, FACTORY, WALLET_CREATED } from "./constants";

cube(`DaiBalance`, {
    sql: `

with prices as (
    select symbol, price from crawl.prices
    where base = 'USD' and symbol in ('DAI')
    and date = current_date
)
select
   block_id,
   data as dai_balance,      
   key_path->1 as key_path,
   row_number() over (partition by key_path->1 order by block_id desc, emit_seq desc) as rn,
   p.price as price
   from batch.trace_sstore_events tse

left join prices p
on p.symbol = 'DAI' 

where tse.account = '${DAI_CONTRACT}'
    and key_path->0 = '1'

` ,

    measures: {
        Dai_balance: {
            type: `sum`,
            sql: `coalesce(dai_balance, 0) / 1e18`,
            format: `currency`,
            title: "DAI balance"
        },
        Dai_USD_quote_rate: {
            type: `sum`,
            sql: `price`,
            format: `currency`,
            title: "DAI USD quote rate"
        },
        Dai_USD_balance_quote: {
            type: `sum`,
            sql: `price * coalesce(dai_balance, 0) / 1e18`,
            format: `currency`,
            title: "DAI balance quote"
        }
    },
    dimensions: {
        keyPath: {
            sql: `key_path`,
            type: `string`,
            primaryKey: true
        }
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }
});
