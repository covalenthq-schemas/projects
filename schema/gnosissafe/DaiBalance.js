import { DAI_TOKEN_CONTRACT } from "./constants";

cube(`DaiBalance`, {
    sql: `select 
    data as dai_balance,
    key_path->1 as key_path,
    row_number() over (partition by key_path->1 order by block_id desc, emit_seq desc) as rn
    from batch.trace_sstore_events tse
where tse.account = '${DAI_TOKEN_CONTRACT}'
and key_path->0 = '1'::jsonb
` ,

    measures: {
        DaiBalance: {
            type: `sum`,
            sql: `coalesce(dai_balance, 0) / 1e18`,
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
