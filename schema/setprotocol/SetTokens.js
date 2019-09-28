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

    select set_type, 
    '0x' || encode(set_token_address, 'hex') as set_token_address,
    '0x' || encode(base_token_address, 'hex') as base_token_address,
    supply_tbl.supply,
    units_tbl.units,
    nunits_tbl.naturalunit

    from stb_pre_aggregations.sp_token_base lhs

    left join
    (
        select account, coalesce(data, 0) / 1e18 as supply,
        row_number() over (partition by account order by block_id desc, emit_seq desc) as rn
        from (
            select * from batch.trace_sstore_events
        	where block_id > ${BLOCK_ID_START} 
        	and account in (select set_token_address from stb_pre_aggregations.sp_token_base)
        	and key_path->0 = '2'
        ) x
    ) supply_tbl
    on supply_tbl.account = lhs.set_token_address and supply_tbl.rn = 1

    left join
    (
        select account, data as units,
        row_number() over (partition by account order by block_id desc, emit_seq desc) as rn
        from (
            select * from batch.trace_sstore_events
        	where block_id > ${BLOCK_ID_START} 
        	and account in (select set_token_address from stb_pre_aggregations.sp_token_base where set_type = 'Rebalancing Set')
        	and key_path->0 = '15'
        ) x

        union 
        
        select account, data as units,
        row_number() over (partition by account order by block_id desc, emit_seq desc) as rn
        from (
            select * from batch.trace_sstore_events
        	where block_id > 1424239138687365400 
        	and account in (select set_token_address from stb_pre_aggregations.sp_token_base where set_type = 'Static Set')
        	and key_path->0 = '8'
        ) x

    ) units_tbl
    on units_tbl.account = lhs.set_token_address and units_tbl.rn = 1

    left join
    (
        select account, data as naturalunit,
        row_number() over (partition by account order by block_id desc, emit_seq desc) as rn
        from (
            select * from batch.trace_sstore_events
        	where block_id > ${BLOCK_ID_START} 
        	and account in (select set_token_address from stb_pre_aggregations.sp_token_base where set_type = 'Rebalancing Set')
        	and key_path->0 = '12'
        ) x
    ) nunits_tbl
    on nunits_tbl.account = lhs.set_token_address and nunits_tbl.rn = 1    

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
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }    
});
