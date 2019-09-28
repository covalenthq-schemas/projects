create table stb_pre_aggregations.sp_token_base as (
    select set_type, 
set_token_address, baseset_tbl.base_token_address as base_token_address
    from (
        select set_type, 
        set_token_address
        from (
select 'Static Set' as set_type, substr(topics[2], 13) as set_token_address,
    hex_to_int(encode(substr(topics[2], 13), 'hex')) as decimal_addr
    from live.block_log_events
    where not (
        substr(encode(data, 'hex'), 25, 40) = 'd85af84c22b71bdaa25333a7898ddc6f2f1088eb' or 
        substr(encode(data, 'hex'), 25, 40) = 'ad78e5570f24a268687c6cc0f73966e9978568a7' or
        substr(encode(data, 'hex'), 25, 40) = '15518cdd49d83471e9f85cdcfbd72c8e2a78dde2'            
    ) and
    topics[1] = '\xa31e381e140096a837a20ba16eb64e32a4011fda0697adbfd7a8f7341c56aa94'
    AND sender = '\xf55186cc537e7067ea616f2aae007b4427a120c8'  
) xxx__2

        union 
        select set_type, 
        set_token_address
        from (
select 'Rebalancing Set' as set_type, substr(topics[2], 13) as set_token_address
from live.block_log_events
where (
    substr(encode(data, 'hex'), 25, 40) = 'd85af84c22b71bdaa25333a7898ddc6f2f1088eb' or 
    substr(encode(data, 'hex'), 25, 40) = 'ad78e5570f24a268687c6cc0f73966e9978568a7' or
    substr(encode(data, 'hex'), 25, 40) = '15518cdd49d83471e9f85cdcfbd72c8e2a78dde2'            
) and
topics[1] = '\xa31e381e140096a837a20ba16eb64e32a4011fda0697adbfd7a8f7341c56aa94'
AND sender = '\xf55186cc537e7067ea616f2aae007b4427a120c8'    
) xxx__

    ) lhs
    
    left join
    (
        select ss.set_token_address as base_token_address, 
        account,
        row_number() over (partition by account order by block_id desc, emit_seq desc) as rn
        from batch.trace_sstore_events_201909 tse 
        join ( 
            select * from (
select 'Static Set' as set_type, substr(topics[2], 13) as set_token_address,
    hex_to_int(encode(substr(topics[2], 13), 'hex')) as decimal_addr
    from live.block_log_events
    where not (
        substr(encode(data, 'hex'), 25, 40) = 'd85af84c22b71bdaa25333a7898ddc6f2f1088eb' or 
        substr(encode(data, 'hex'), 25, 40) = 'ad78e5570f24a268687c6cc0f73966e9978568a7' or
        substr(encode(data, 'hex'), 25, 40) = '15518cdd49d83471e9f85cdcfbd72c8e2a78dde2'            
    ) and
    topics[1] = '\xa31e381e140096a837a20ba16eb64e32a4011fda0697adbfd7a8f7341c56aa94'
    AND sender = '\xf55186cc537e7067ea616f2aae007b4427a120c8'  
) xxx__2

        ) ss
        on tse.data = ss.decimal_addr
        where key_path->0 = '14'::jsonb
        and account in (
            select set_token_address from (
select 'Rebalancing Set' as set_type, substr(topics[2], 13) as set_token_address
from live.block_log_events
where (
    substr(encode(data, 'hex'), 25, 40) = 'd85af84c22b71bdaa25333a7898ddc6f2f1088eb' or 
    substr(encode(data, 'hex'), 25, 40) = 'ad78e5570f24a268687c6cc0f73966e9978568a7' or
    substr(encode(data, 'hex'), 25, 40) = '15518cdd49d83471e9f85cdcfbd72c8e2a78dde2'            
) and
topics[1] = '\xa31e381e140096a837a20ba16eb64e32a4011fda0697adbfd7a8f7341c56aa94'
AND sender = '\xf55186cc537e7067ea616f2aae007b4427a120c8'    
) xxx__

        )
    ) baseset_tbl
    on baseset_tbl.account = lhs.set_token_address and baseset_tbl.rn = 1

)
