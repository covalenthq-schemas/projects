 import { CWBTC_CONTRACT } from "./constants";

cube(`CompoundWbtc`, {
    sql: `select 
   data as cwbtc_balance,      
        key_path->1 as key_path,
        row_number() over (partition by key_path->1 order by block_id desc, emit_seq desc) as rn
        from batch.trace_sstore_events tse
    where tse.account = '${CWBTC_CONTRACT}'
    and key_path->0 = '15'::jsonb
` ,

    measures: {
        cWbtc_balance: {
            type: `sum`,
            sql: `coalesce(cwbtc_balance, 0) / 1e8`,
            format: `currency`
        },
    },
    dimensions: {
        keyPath: {
            sql: `key_path`,
            type: `string`,
            primaryKey: true
        }
    }
});
