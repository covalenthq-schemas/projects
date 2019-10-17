import { CUSDC_CONTRACT } from "./constants";

cube(`CompoundUsdc`, {
    sql: `
    with prices as (
        select symbol, price from crawl.prices
        where base = 'USD' and symbol in ('CDAI', 'CBAT', 'CETH', 'CREP', 'CUSDC', 'CWBTC', 'CZRX', 'ETH')
        and date = current_date
    )
    
    select 
       data as cusdc_balance,      
        key_path->1 as key_path,
        row_number() over (partition by key_path->1 order by block_id desc, emit_seq desc) as rn,
        p.price as price
        from batch.trace_sstore_events tse

    left join prices p
    on p.symbol = 'CUSDC'

    where tse.account = '${CUSDC_CONTRACT}'
        and key_path->0 = '15'::jsonb
` ,

    measures: {
        cUsdc_balance: {
            type: `sum`,
            sql: `coalesce(cusdc_balance, 0) / 1e8`,
            format: `currency`,
            title: "cUSDC balance"
        },
        cUsdc_USD_quote_rate: {
            type: `sum`,
            sql: `price`,
            format: `currency`,
            title: "cUSDC USD quote"
        },
        cUsdc_USD_balance_quote: {
            type: `sum`,
            sql: `price * coalesce(cusdc_balance, 0) / 1e8`,
            format: `currency`,
            title: "cUSDC balance quote"
        }    
    },
    dimensions: {
        keyPath: {
            sql: `key_path`,
            type: `string`,
            primaryKey: true
        }
    }
});
