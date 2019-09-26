import { GNO_TOKEN_CONTRACT} from "./constants";

cube(`GnoBalance`, {
    sql: `
select 
    data as gno_balance,
    key_path->1 as key_path,
    row_number() over (partition by key_path->1 order by block_id desc, emit_seq desc) as rn
    from batch.trace_sstore_events tse
    where tse.account = '${GNO_TOKEN_CONTRACT}'
    and key_path->0 = '0'::jsonb
` ,

    measures: {
        GnoBalance: {
            type: `sum`,
            sql: `coalesce(gno_balance, 0) / 1e18`,
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
