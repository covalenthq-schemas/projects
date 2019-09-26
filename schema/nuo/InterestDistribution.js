import {
    NUO_RESERVE_CONTRACT,
    DAI_TOKEN_CONTRACT,
    USDC_TOKEN_CONTRACT,
    WETH_TOKEN_CONTRACT,
    MKR_TOKEN_CONTRACT,
    WBTC_TOKEN_CONTRACT,
    LINK_TOKEN_CONTRACT,
    TUSD_TOKEN_CONTRACT,
    BAT_TOKEN_CONTRACT,
    KNC_TOKEN_CONTRACT,
    REP_TOKEN_CONTRACT,
    ZRX_TOKEN_CONTRACT,
} from "./constants";

cube(`InterestDistribution`, {
    sql: `

    select *,
    sum(z.profit)  over (partition by token order by date rows between 7 preceding and current row) as r_sum, 
    avg(z.reserve)  over (partition by token order by date rows between 7 preceding and current row) as r_avg
    from (

    select case 
    when token = '"${DAI_TOKEN_CONTRACT}"'::jsonb then 'DAI'
    when token = '"${USDC_TOKEN_CONTRACT}"'::jsonb then 'USDC'
    when token = '"${WETH_TOKEN_CONTRACT}"'::jsonb then 'WETH'
    when token = '"${MKR_TOKEN_CONTRACT}"'::jsonb then 'MKR'
    when token = '"${WBTC_TOKEN_CONTRACT}"'::jsonb then 'WBTC'
    when token = '"${LINK_TOKEN_CONTRACT}"'::jsonb then 'LINK'
    when token = '"${TUSD_TOKEN_CONTRACT}"'::jsonb then 'TUSD'
    when token = '"${BAT_TOKEN_CONTRACT}"'::jsonb then 'BAT'
    when token = '"${KNC_TOKEN_CONTRACT}"'::jsonb then 'KNC'
    when token = '"${REP_TOKEN_CONTRACT}"'::jsonb then 'REP'
    when token = '"${ZRX_TOKEN_CONTRACT}"'::jsonb then 'ZRX'
    else 'Other'
    end as token,
    date + interval '86400 seconds' as date, 
    sum(case when col = 'reserve' 
    then data  * (case
        when token = '"${DAI_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${USDC_TOKEN_CONTRACT}"'::jsonb then 1e-6
        when token = '"${WETH_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${MKR_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${WBTC_TOKEN_CONTRACT}"'::jsonb then 1e-8
        when token = '"${LINK_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${TUSD_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${BAT_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${KNC_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${REP_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${ZRX_TOKEN_CONTRACT}"'::jsonb then 1e-18
        else -1
    end)       
    else 0 end) as reserve,
    sum(case when col = 'profit'
    then data * (case
        when token = '"${DAI_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${USDC_TOKEN_CONTRACT}"'::jsonb then 1e-6
        when token = '"${WETH_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${MKR_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${WBTC_TOKEN_CONTRACT}"'::jsonb then 1e-8
        when token = '"${LINK_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${TUSD_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${BAT_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${KNC_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${REP_TOKEN_CONTRACT}"'::jsonb then 1e-18
        when token = '"${ZRX_TOKEN_CONTRACT}"'::jsonb then 1e-18
        else -1
    end) 
    else 0 end) as profit
    from (
    
    select  date, token, 'profit' as col, data from (
    select  
    (TIMESTAMP WITH TIME ZONE 'epoch' + cast(key_path->1 as integer) * INTERVAL '1 second') as date, 
    key_path->2 as token, 
     data, row_number() over(partition by key_path->1, key_path->2 order by block_id desc, emit_seq desc) as rn
    from 
        (
        select * from batch.trace_sstore_events tse
        where tse.account = '${NUO_RESERVE_CONTRACT}'
            and key_path->0 = '15'::jsonb
            and key_path->2 in (
                '"${DAI_TOKEN_CONTRACT}"'::jsonb, 
                '"${USDC_TOKEN_CONTRACT}"'::jsonb,
                '"${WETH_TOKEN_CONTRACT}"'::jsonb,
                '"${MKR_TOKEN_CONTRACT}"'::jsonb,
                '"${WBTC_TOKEN_CONTRACT}"'::jsonb,
                '"${LINK_TOKEN_CONTRACT}"'::jsonb,
                '"${TUSD_TOKEN_CONTRACT}"'::jsonb,
                '"${BAT_TOKEN_CONTRACT}"'::jsonb,
                '"${KNC_TOKEN_CONTRACT}"'::jsonb,
                '"${REP_TOKEN_CONTRACT}"'::jsonb,
                '"${ZRX_TOKEN_CONTRACT}"'::jsonb
            )
        ) x1
    ) x2
    where x2.rn = 1
    
    union
    
    select date, token, 'reserve' as col, data from (
    select 
    (TIMESTAMP WITH TIME ZONE 'epoch' + cast(key_path->1 as integer) * INTERVAL '1 second') as date, 
    key_path->2 as token,
    data from batch.trace_sstore_events tse
    where tse.account = '${NUO_RESERVE_CONTRACT}'
    and key_path->0 = '17'::jsonb
    and key_path->2 in (
        '"${DAI_TOKEN_CONTRACT}"'::jsonb, 
        '"${USDC_TOKEN_CONTRACT}"'::jsonb,
        '"${WETH_TOKEN_CONTRACT}"'::jsonb,
        '"${MKR_TOKEN_CONTRACT}"'::jsonb,
        '"${WBTC_TOKEN_CONTRACT}"'::jsonb,
        '"${LINK_TOKEN_CONTRACT}"'::jsonb,
        '"${TUSD_TOKEN_CONTRACT}"'::jsonb,
        '"${BAT_TOKEN_CONTRACT}"'::jsonb,
        '"${KNC_TOKEN_CONTRACT}"'::jsonb,
        '"${REP_TOKEN_CONTRACT}"'::jsonb,
        '"${ZRX_TOKEN_CONTRACT}"'::jsonb
    )        
    ) x
    ) y
    group by 1, 2
    order by 1, 2
    ) z
` ,

    measures: {
        count: {
            type: `count`,
            drillMembers: [`${CUBE}.token`, `${CUBE}.Created`]
        },
        reserve: {
            sql: `reserve`,
            type: `avg`
        },
        DailyGains: {
            sql: `profit`,
            type: `avg`
        },
        Daily_Gain_Perc: {
            sql: `case when ${CUBE}.reserve = 0 then 0 else (profit / ${CUBE}.reserve) end`,
            type: `avg`,
            title: `Daily Gains (%)`,
            format: `percent`
        },
        Weekly_Gain_APR: {
            sql: `r_sum * (365 / 7) / r_avg`,
            type: `avg`,
            title: `Rolling Weekly Gains (APR)`,
            format: `percent`
        }
    },

    dimensions: {
        Date: {
            sql: `${CUBE}.date`,
            type: `time`
        },
        token: {
            sql: `token`,
            type: `string`
        }
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }
});
