import { SET_TOKEN_CREATED_EVENT, SET_CORE } from "./constants";

// take 0xa35fc5019c4dc509394bd4d74591a0bf8852c195 as example
// underlying set 0x2e83ba9b863e0b4fd0cc377e5a9106c384fd79ac
// components 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599, 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2 

// 2 - supply
// 20, 14 underlying set 

cube('SetTokens', {
    sql: `
    with staticsets as (
        select 'Static Set' as set_type, substr(topics[2], 13) as set_token_address,
        hex_to_int(encode(substr(topics[2], 13), 'hex')) as decimal_addr
        from live.block_log_events
        where not (
            substr(encode(data, 'hex'), 25, 40) = 'd85af84c22b71bdaa25333a7898ddc6f2f1088eb' or 
            substr(encode(data, 'hex'), 25, 40) = 'ad78e5570f24a268687c6cc0f73966e9978568a7' or
            substr(encode(data, 'hex'), 25, 40) = '15518cdd49d83471e9f85cdcfbd72c8e2a78dde2'            
        ) and
        topics[1] = '${SET_TOKEN_CREATED_EVENT}'
        AND sender = '${SET_CORE}'    
    ),
    rebalancingsets as (
        select 'Rebalancing Set' as set_type, substr(topics[2], 13) as set_token_address
        from live.block_log_events
        where (
            substr(encode(data, 'hex'), 25, 40) = 'd85af84c22b71bdaa25333a7898ddc6f2f1088eb' or 
            substr(encode(data, 'hex'), 25, 40) = 'ad78e5570f24a268687c6cc0f73966e9978568a7' or
            substr(encode(data, 'hex'), 25, 40) = '15518cdd49d83471e9f85cdcfbd72c8e2a78dde2'            
        ) and
        topics[1] = '${SET_TOKEN_CREATED_EVENT}'
        AND sender = '${SET_CORE}'        
    )
    
    select set_type, 
    '0x' || encode(set_token_address, 'hex') as set_token_address,
    supply_tbl.supply,
    '0x' || encode(baseset_tbl.base_token_address, 'hex') as base_token_address
    from (
        select set_type, 
        set_token_address
        from staticsets
        union 
        select set_type, 
        set_token_address
        from rebalancingsets
    ) lhs
    
    left join
    (
        select account, coalesce(data, 0) / 1e18 as supply,
        row_number() over (partition by account order by block_id desc, emit_seq desc) as rn
        from batch.trace_sstore_events_201909
        where account in (
            select set_token_address from staticsets
            union select set_token_address from rebalancingsets
        ) and
        key_path->0 = '2'
    ) supply_tbl
    on supply_tbl.account = lhs.set_token_address and supply_tbl.rn = 1
    
    left join
    (
        select ss.set_token_address as base_token_address, 
        account,
        row_number() over (partition by account order by block_id desc, emit_seq desc) as rn
        from batch.trace_sstore_events_201909 tse 
        join ( 
            select * from staticsets
        ) ss
        on tse.data = ss.decimal_addr
        where key_path->0 = '14'::jsonb
        and account in (
            select set_token_address from rebalancingsets
        )
    ) baseset_tbl
    on baseset_tbl.account = lhs.set_token_address and baseset_tbl.rn = 1
    `,
    measures: {
        count: {
            type: `count`,
        },
        supply: {
            type: `sum`,
            sql: `supply`
        },
        holders: {
            type: `sum`,
            sql: `0`
        },
        price_usd: {
            type: `avg`,
            sql: `0`
        }
    },
    dimensions: {
        // blockId: {
        //     sql: `block_id`,
        //     type: `number`,
        //     primaryKey: true
        // },
        setTokenAddress: {
            sql: `set_token_address`,
            type: `string`
        },
        setTokenAddressLink: {
            sql: `'https://etherscan.io/address/' || set_token_address`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        },
        setType: {
            type: `string`,
            sql: `set_type`
        },
        baseTokenAddress: {
            sql: `base_token_address`,
            type: `string`
        }
    }
});
