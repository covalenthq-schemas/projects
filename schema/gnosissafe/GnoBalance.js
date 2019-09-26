import { GNO_TOKEN_CONTRACT} from "./constants";

cube(`GnoBalance`, {
    sql: `
with prices as (
    select symbol, price from crawl.prices
    where base = 'USD' and symbol in ('GNO')
    and date = current_date
)
select 
    data as gno_balance,
    key_path->1 as key_path,
    row_number() over (partition by key_path->1 order by block_id desc, emit_seq desc) as rn,
    p.price as gno_price
    from batch.trace_sstore_events tse
left join prices p
on p.symbol = 'GNO'
    where tse.account = '${GNO_TOKEN_CONTRACT}'
    and key_path->0 = '0'::jsonb
` ,

    measures: {
        GnoBalance: {
            type: `sum`,
            sql: `coalesce(gno_balance, 0) / 1e18`,
            format: `currency`
        },
        GnoBalance_USD: {
            type: `sum`,
            sql: `gno_price * coalesce(gno_balance, 0) / 1e18`,
            format: `currency`,
            title: `GNO balance (in USD)`
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
