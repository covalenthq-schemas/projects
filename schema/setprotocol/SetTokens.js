import { SET_TOKEN_CREATED_EVENT, SET_CORE } from "./constants";

// take 0xa35fc5019c4dc509394bd4d74591a0bf8852c195 as example
// underlying set 0x2e83ba9b863e0b4fd0cc377e5a9106c384fd79ac
// components 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599, 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2 

// 2 - supply
// 20, 14 - underlying set 
// 12 - natural unit
// 15 - units for rebalancing
// 8 - units for static
const BLOCK_ID_START = 1390900854189650515;

cube('SetTokens', {
    sql: `

    with staticsets as (
        select *, 
        (string_to_array(substr(encode(data, 'hex'), 1+(64*7), 64 * logged_components_length), '000000000000000000000000'))[2:] as logged_components

        from
        (
            select 'Static Set' as set_type, substr(topics[2], 13) as set_token_address
            , substr(substr(encode(data, 'hex'), 1+(64*0),64), 25) as "logged_factory"
            , hex_to_int(substr(encode(data, 'hex'), 1+(64*1),64)) as "logged_components_slen"
            , hex_to_int(substr(encode(data, 'hex'), 1+(64*2),64)) as "logged_units_slen"
            , hex_to_int(substr(encode(data, 'hex'), 1+(64*3),64)) as "logged_naturalunit"
            , convert_from(decode(replace(substr(encode(data, 'hex'), 1+(64*4),64), '00',''), 'hex'), 'utf-8') as "logged_name"
            , convert_from(decode(replace(substr(encode(data, 'hex'), 1+(64*5),64), '00' ,''), 'hex'), 'utf-8') as "logged_symbol"
            , hex_to_int(substr(encode(data, 'hex'), 1+(64*6), 64))::int as "logged_components_length"
            , data
            from live.block_log_events
            where not (
                substr(encode(data, 'hex'), 25, 40) = 'd85af84c22b71bdaa25333a7898ddc6f2f1088eb' or 
                substr(encode(data, 'hex'), 25, 40) = 'ad78e5570f24a268687c6cc0f73966e9978568a7' or
                substr(encode(data, 'hex'), 25, 40) = '15518cdd49d83471e9f85cdcfbd72c8e2a78dde2'            
            ) and
            topics[1] = '${SET_TOKEN_CREATED_EVENT}'
            AND sender = '${SET_CORE}'
        ) x
    ),
    rebalancingsets as (
        select *, 
        (string_to_array(substr(encode(data, 'hex'), 1+(64*7), 64 * logged_components_length), '000000000000000000000000'))[2:] as logged_components
        from 
        (
            select 'Rebalancing Set' as set_type, substr(topics[2], 13) as set_token_address
            , substr(substr(encode(data, 'hex'), 1+(64*0),64), 25) as "logged_factory"
            , hex_to_int(substr(encode(data, 'hex'), 1+(64*1),64)) as "logged_components_slen"
            , hex_to_int(substr(encode(data, 'hex'), 1+(64*2),64)) as "logged_units_slen"
            , hex_to_int(substr(encode(data, 'hex'), 1+(64*3),64)) as "logged_naturalunit"
            , convert_from(decode(replace(substr(encode(data, 'hex'), 1+(64*4),64), '00',''), 'hex'), 'utf-8') as "logged_name"
            , convert_from(decode(replace(substr(encode(data, 'hex'), 1+(64*5),64), '00' ,''), 'hex'), 'utf-8') as "logged_symbol"
            , hex_to_int(substr(encode(data, 'hex'), 1+(64*6), 64))::int as "logged_components_length"
            , data
            from live.block_log_events
            where (
                substr(encode(data, 'hex'), 25, 40) = 'd85af84c22b71bdaa25333a7898ddc6f2f1088eb' or 
                substr(encode(data, 'hex'), 25, 40) = 'ad78e5570f24a268687c6cc0f73966e9978568a7' or
                substr(encode(data, 'hex'), 25, 40) = '15518cdd49d83471e9f85cdcfbd72c8e2a78dde2'            
            ) and
            topics[1] = '${SET_TOKEN_CREATED_EVENT}'
            AND sender = '${SET_CORE}'   
        ) x     
    ),
    lhs as (
        select * from staticsets 
        union 
        select * from rebalancingsets        
    )
    
    select * from lhs
left join
(
    select account, data as units,
    row_number() over (partition by account order by block_id desc, emit_seq desc) as rn
    from (
        select * from batch.trace_sstore_events
        where block_id > ${BLOCK_ID_START} 
        and account in (select set_token_address from lhs where set_type = 'Rebalancing Set')
        and key_path->0 = '15'
    ) x

    union 
    
    select account, data as units,
    row_number() over (partition by account order by block_id desc, emit_seq desc) as rn
    from (
        select * from batch.trace_sstore_events
        where block_id > ${BLOCK_ID_START}  
        and account in (select set_token_address from lhs where set_type = 'Static Set')
        and key_path->0 = '8'
    ) x

) units_tbl
on units_tbl.account = lhs.set_token_address and units_tbl.rn = 1


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
        },
        units: {
            sql: `units`,
            type: `sum`
        },
        naturalUnit: {
            sql: `naturalunit`,
            type: `sum`
        }
    },
    dimensions: {
        // blockId: {
        //     sql: `block_id`,
        //     type: `number`,
        //     primaryKey: true
        // },
        setTokenAddress: {
            sql: `'0x' || encode(set_token_address, 'hex')`,
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
        },
        name: {
            sql: `logged_name`,
            type: `string`
        },
        symbol: {
            sql: `logged_symbol`,
            type: `string`
        },
        components: {
            sql: `logged_components`,
            type: `string`
        }
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }    
});
