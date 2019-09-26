import { CUSDC_CONTRACT } from "./constants";

cube(`CompoundUsdc`, {
    sql: `select 
   data as cusdc_balance,      
        key_path->1 as key_path,
        row_number() over (partition by key_path->1 order by block_id desc, emit_seq desc) as rn
        from batch.trace_sstore_events tse
    where tse.account = '${CUSDC_CONTRACT}'
    and key_path->0 = '15'::jsonb
` ,

    measures: {
        cUsdc_balance: {
            type: `sum`,
            sql: `coalesce(cusdc_balance, 0) / 1e8`,
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
