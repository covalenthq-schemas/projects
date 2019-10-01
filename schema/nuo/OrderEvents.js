import {
    LogOrderCreated, KERNEL_CONTRACT, DECIMALS,
    DAI_TOKEN_CONTRACT,
    USDC_TOKEN_CONTRACT,
    WETH_TOKEN_CONTRACT,
    MKR_TOKEN_CONTRACT,
    WBTC_TOKEN_CONTRACT,
    LINK_TOKEN_CONTRACT,
    TUSD_TOKEN_CONTRACT,
    TUSD_OLD_TOKEN_CONTRACT,
    BAT_TOKEN_CONTRACT,
    KNC_TOKEN_CONTRACT,
    REP_TOKEN_CONTRACT,
    ZRX_TOKEN_CONTRACT
} from "./constants";

cube('OrderCreatedEvents', {
    sql: `
with prices as (
    select symbol, date, price from crawl.prices
    where base = 'USD' and symbol in ('DAI', 'USDC', 'WETH', 'MKR', 'WBTC', 'LINK', 'TUSD', 'BAT', 'KNC', 'REP', 'ZRX')
)    

select 
    block_signed_at, 
    tx_hash,
    order_hash,
    account, 
    principle_token,
    collateral_token,
    premium,
    principle_token_name,
    collateral_token_name,
    expiration_timestamp, 
    fee,
    pp.price * principle_amount as principle_amount_usd, 
    pc.price * collateral_amount as collateral_amount_usd
from (
    select *,

    case 
        when collateral_token = '${USDC_TOKEN_CONTRACT}' then 'USDC' 
        when collateral_token = '${DAI_TOKEN_CONTRACT}' then 'DAI' 
        when collateral_token = '${WETH_TOKEN_CONTRACT}' then 'WETH' 
        when collateral_token = '${MKR_TOKEN_CONTRACT}' then 'MKR' 
        when collateral_token = '${WBTC_TOKEN_CONTRACT}' then 'WBTC' 
        when collateral_token = '${LINK_TOKEN_CONTRACT}' then 'LINK' 
        when collateral_token = '${TUSD_TOKEN_CONTRACT}' then 'TUSD' 
        when collateral_token = '${TUSD_OLD_TOKEN_CONTRACT}' then 'TUSD' 
        when collateral_token = '${BAT_TOKEN_CONTRACT}' then 'BAT' 
        when collateral_token = '${KNC_TOKEN_CONTRACT}' then 'KNC' 
        when collateral_token = '${REP_TOKEN_CONTRACT}' then 'REP' 
        when collateral_token = '${ZRX_TOKEN_CONTRACT}' then 'ZRX' 
    end as collateral_token_name,

    case 
        when principle_token = '${USDC_TOKEN_CONTRACT}' then 'USDC' 
        when principle_token = '${DAI_TOKEN_CONTRACT}' then 'DAI' 
        when principle_token = '${WETH_TOKEN_CONTRACT}' then 'WETH' 
        when principle_token = '${MKR_TOKEN_CONTRACT}' then 'MKR' 
        when principle_token = '${WBTC_TOKEN_CONTRACT}' then 'WBTC' 
        when principle_token = '${LINK_TOKEN_CONTRACT}' then 'LINK' 
        when principle_token = '${TUSD_TOKEN_CONTRACT}' then 'TUSD' 
        when principle_token = '${TUSD_OLD_TOKEN_CONTRACT}' then 'TUSD' 
        when principle_token = '${BAT_TOKEN_CONTRACT}' then 'BAT' 
        when principle_token = '${KNC_TOKEN_CONTRACT}' then 'KNC' 
        when principle_token = '${REP_TOKEN_CONTRACT}' then 'REP' 
        when principle_token = '${ZRX_TOKEN_CONTRACT}' then 'ZRX' 
    end as principle_token_name


    from (
        select
            block_id,
            block_signed_at,
            block_height,
            '0x' || encode(tx_hash, 'hex') as "tx_hash",
            '0x' || encode(topics[2], 'hex') as order_hash,
            '0x' || substr(encode(topics[3], 'hex'), 25) as account,
            substr(encode(topics[4], 'hex'), 25) as principle_token

            , substr(substr(encode(e.data,'hex'), 1+(64*0), 64), 25) as "collateral_token"
            , substr(substr(encode(e.data,'hex'), 1+(64*1), 64), 25) as "by_user"
            , hex_to_int(substr(encode(e.data,'hex'), 1+(64*2), 64)) as "principle_amount"
            , hex_to_int(substr(encode(e.data,'hex'), 1+(64*3), 64)) as "collateral_amount"
            , hex_to_int(substr(encode(e.data,'hex'), 1+(64*4), 64)) as "premium"
            , hex_to_int(substr(encode(e.data,'hex'), 1+(64*5), 64)) as "expiration_timestamp"
            , hex_to_int(substr(encode(e.data,'hex'), 1+(64*6), 64)) as "fee"

        from
            live.block_log_events e
        where
            e.topics[1] = '${LogOrderCreated}'
            and e.sender = '${KERNEL_CONTRACT}'     
        
    ) xx
) x

left join prices pp
on pp.symbol = principle_token_name and date_trunc('day', x.block_signed_at) = pp.date

left join prices pc
on pc.symbol = collateral_token_name and date_trunc('day', x.block_signed_at) = pc.date

`,
    measures: {
        count: {
            type: `count`,
        },
        collateralAmount: {
            sql: `collateral_amount / ${DECIMALS("collateral_token")}`,
            type: `sum`,
            format: `currency`
        },
        collateralAmountUSD: {
            sql: `collateral_amount_usd  /  ${DECIMALS("collateral_token")}`,
            type: `sum`,
            format: `currency`,
            title: `Collateral Amount (USD)`
        },
        principleAmount: {
            sql: `principle_amount / ${DECIMALS("principle_token")}`,
            type: `sum`,
            format: `currency`
        },
        principleAmountUSD: {
            sql: `principle_amount_usd  /  ${DECIMALS("principle_token")}`,
            type: `sum`,
            format: `currency`,
            title: `Principle Amount (USD)`
        },
        fee: {
            sql: `fee`,
            type: `sum`
        }
    },
    dimensions: {
        Created_date: {
            sql: `date_trunc('day', ${CUBE}.block_signed_at)`,
            type: `time`
        },
        Created_week: {
            sql: `date_trunc('week', ${CUBE}.block_signed_at)`,
            type: `time`
        },
        Created_month: {
            sql: `date_trunc('month', ${CUBE}.block_signed_at)`,
            type: `time`
        },
        Created: {
            sql: `${CUBE}.block_signed_at`,
            type: `time`
        },
        TxHash: {
            sql: 'tx_hash',
            type: `string`
        },
        orderHash: {
            sql: `order_hash`,
            type: `string`
        },
        byUser: {
            sql: `by_user`,
            type: `string`
        },
        principleTokenAddress: {
            sql: `'0x' || principle_token`,
            type: `string`
        },
        principleTokenName: {
            type: `string`,
            sql: `principle_token_name`
        },
        collateralTokenAddress: {
            sql: `'0x' || collateral_token`,
            type: `string`
        },
        collateralTokenName: {
            type: `string`,
            sql: `collateral_token_name`

        },
        premium: {
            sql: `premium`,
            type: `number`
        },
        expiration_timestamp: {
            sql: `to_timestamp(expiration_timestamp)`,
            type: `time`
        },
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }
})
