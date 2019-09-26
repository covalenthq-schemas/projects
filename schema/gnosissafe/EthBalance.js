import { CONTRACT_INSTANTIATION , GNOSIS_FACTORY} from "./constants";

cube(`EthBalance`, {
    sql: `
select 
    account, value as balance ,
    row_number() over (partition by account order by block_id desc, emit_seq desc) as rn
    from batch.trace_balance_events  
    where account in  
    (
        select substr(e.data, 45, 20) from 
        live.block_log_events e
        where
        e.topics[1] = '${CONTRACT_INSTANTIATION}'
        and e.sender = '${GNOSIS_FACTORY}'  
    )
` ,

    measures: {
        EthBalance: {
            type: `sum`,
            sql: `coalesce(balance, 0) / 1e18`,
            format: `currency`
        },
    },
    dimensions: {
        keyPath: {
            sql: `account`,
            type: `string`,
            primaryKey: true
        }
    }
});
