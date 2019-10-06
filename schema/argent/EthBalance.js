import { WALLET_CREATED, FACTORY} from "./constants";

cube(`EthBalance`, {
    sql: `
with prices as (
    select symbol, price from crawl.prices
    where base = 'USD' and symbol in ('ETH')
    and date = current_date
)
select 
    account, value as balance ,
    row_number() over (partition by account order by block_id desc, emit_seq desc) as rn,
    p.price as eth_price
    from batch.trace_balance_events  
left join prices p
on p.symbol = 'ETH'
    where account in  
    (
        select substr(e.data, 13, 20) from 
        live.block_log_events e
        where
        e.topics[1] = '${WALLET_CREATED}'
        and e.sender = '${FACTORY}'  
    )
` ,

    measures: {
        EthBalance: {
            type: `sum`,
            sql: `coalesce(balance, 0) / 1e18`,
            format: `currency`
        },
        EthBalance_USD: {
            type: `sum`,
            sql: `coalesce(eth_price, 0) * coalesce(balance, 0) / 1e18`,
            format: `currency`,
            title: `ETH balance (USD)`
        }
    },
    dimensions: {
        keyPath: {
            sql: `account`,
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
