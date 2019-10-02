import { LIQUIDATE_BORROW } from "./constants";

cube(`BorrowLiquidations`, {
    sql: `
    with prices as (
        select symbol, date, price from crawl.prices
        where base = 'USD' and symbol in ('ETH')
    )    
    select 
        block_id,
        block_signed_at,
        '0x' || encode(sender, 'hex') as sender, 
        '0x' || substr(substr(encode(data, 'hex'), 1+(64*0), 64), 25) as logged_liquidator,
        '0x' || substr(substr(encode(data, 'hex'), 1+(64*1), 64), 25) as logged_borrower,
        hex_to_int(substr(encode(data, 'hex'), 1+(64*2), 64)) as logged_repayAmount,
        substr(substr(encode(data, 'hex'), 1+(64*3), 64), 25) as logged_cTokenCollateral,
        hex_to_int(substr(encode(data, 'hex'), 1+(64*4), 64)) as logged_seizeTokens,
        '0x' || encode(tx_hash, 'hex') as tx_hash,
        gas_offered, gas_spent, gas_price, 
        p.price as eth_price
    from live.block_log_events e
    left join (
        select hash, gas_offered, gas_spent, gas_price 
        from live.block_transactions 
    ) bt
    on bt.hash = e.tx_hash

    left join prices p
    on p.symbol = 'ETH' and  p.date = date_trunc('day', e.block_signed_at)

    where topics[1] = '${LIQUIDATE_BORROW}'

` ,

    measures: {
        count: {
            type: `count`,
            // drillMembers: [Created, walletAddress, walletLink]
        },
        repayAmount: {
            sql: `logged_repayAmount / (
                case 
                when sender = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5' then 1e18
                when sender = '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e' then 1e18
                when sender = '0xf5dce57282a584d2746faf1593d3121fcac444dc' then 1e18
                when sender = '0x158079ee67fce2f58472a96584a73c7ab9ac95c1' then 1e18
                when sender = '0x39aa39c021dfbae8fac545936693ac917d5e7563' then 1e18
                when sender = '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407' then 1e18
                when sender = '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4' then 1e18
                end
            )`,
            type: `sum`
        },
        seizeTokens: {
            sql: `logged_seizeTokens / 1e8`,
            type: `sum`
        },
        TransactionCost_ETH: {
            sql: `gas_spent * gas_price / 1e18`,
            type: `sum`,
            title: `Transaction Cost (ETH)`
        },
        TransactionCost_USD: {
            sql: `eth_price * gas_spent * gas_price / 1e18`,
            type: `sum`,
            title: `Transaction Cost (USD)`
        },
        gasSpent: {
            sql: `gas_spent`,
            type: `sum`
        },
        gasPrice: {
            sql: `gas_price / 1e9`,
            type: `sum`
        },
        roi: {
            sql: `${fees} / ${solidOwedUpdate_deltaWei} `,
            type: `number`,
            format: `percent`
        }
    },
    dimensions: {
        blockId: {
            sql: `block_id`,
            type: `number`,
            primaryKey: true
        },
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
        TxHashLink: {
            sql: `'https://etherscan.io/tx/' || "tx_hash"`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        },
        Liquidator: {
            sql: `logged_liquidator`,
            type: `string`
        },
        Borrower: {
            sql: `logged_borrower`,
            type: `string`
        },
        SenderAddress: {
            sql: `sender`,
            type: `string`
        },
        SenderName: {
            type: `string`,
            case: {
                when: [
                    { sql: `sender = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5'`, label: 'cETH' },
                    { sql: `sender = '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e'`, label: 'cBAT' },
                    { sql: `sender = '0xf5dce57282a584d2746faf1593d3121fcac444dc'`, label: 'cDAI' },
                    { sql: `sender = '0x158079ee67fce2f58472a96584a73c7ab9ac95c1'`, label: 'cREP' },
                    { sql: `sender = '0x39aa39c021dfbae8fac545936693ac917d5e7563'`, label: 'cUSDC' },
                    { sql: `sender = '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407'`, label: 'cZRX' },
                    { sql: `sender = '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4'`, label: 'cWBTC' },
                ]
            }
        },
        CollateralAddress: {
            type: `string`,
            sql: `'0x' || logged_cTokenCollateral`
        },
        CollateralName: {
            type: `string`,
            case: {
                when: [
                    { sql: `logged_cTokenCollateral = '4ddc2d193948926d02f9b1fe9e1daa0718270ed5'`, label: 'cETH' },
                    { sql: `logged_cTokenCollateral = '6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e'`, label: 'cBAT' },
                    { sql: `logged_cTokenCollateral = 'f5dce57282a584d2746faf1593d3121fcac444dc'`, label: 'cDAI' },
                    { sql: `logged_cTokenCollateral = '158079ee67fce2f58472a96584a73c7ab9ac95c1'`, label: 'cREP' },
                    { sql: `logged_cTokenCollateral = '39aa39c021dfbae8fac545936693ac917d5e7563'`, label: 'cUSDC' },
                    { sql: `logged_cTokenCollateral = 'b3319f5d18bc0d84dd1b4825dcde5d5f7266d407'`, label: 'cZRX' },
                    { sql: `logged_cTokenCollateral = 'c11b1268c1a384e55c48c2391d8d480264a3a7f4'`, label: 'cWBTC' },
                ],
            }
        },
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }
});
