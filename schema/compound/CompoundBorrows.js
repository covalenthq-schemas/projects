import { BORROW_EVENT, REPAY_BORROW_EVENT } from "./constants";

cube(`Borrows`, {
    sql: `
    with pricesx as (
        select date, symbol, price from crawl.prices
        where base = 'USD' and symbol in ('ETH', 'BAT', 'DAI', 'REP', 'USDC', 'ZRX', 'WBTC')
    )
    select 
        block_id,
        block_signed_at,
        '0x' || encode(sender, 'hex') as sender, 
        '0x' || substr(substr(encode(data, 'hex'), 1+(64*0), 64), 25) as logged_borrower,
        hex_to_int(substr(encode(data, 'hex'), 1+(64*1), 64)) as logged_borrowamount,
        hex_to_int(substr(encode(data, 'hex'), 1+(64*2), 64)) as logged_accountborrows,
        hex_to_int(substr(encode(data, 'hex'), 1+(64*3), 64)) as logged_totalborrows,
        '0x' || encode(tx_hash, 'hex') as tx_hash,
        p.price as usd_quote_rate,
        p.price * hex_to_int(substr(encode(data, 'hex'), 1+(64*1), 64)) / case 
        when e.sender = '\\x4ddc2d193948926d02f9b1fe9e1daa0718270ed5' then 1e18
        when e.sender = '\\x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e' then 1e18
        when e.sender = '\\xf5dce57282a584d2746faf1593d3121fcac444dc' then 1e18
        when e.sender = '\\x158079ee67fce2f58472a96584a73c7ab9ac95c1' then 1e18
        when e.sender = '\\x39aa39c021dfbae8fac545936693ac917d5e7563' then 1e6
        when e.sender = '\\xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407' then 1e18
        when e.sender = '\\xc11b1268c1a384e55c48c2391d8d480264a3a7f4' then 1e8
    end as usd_quote
    from live.block_log_events e

    left join pricesx p
    on p.date = date_trunc('day', block_signed_at)
    and 
    p.symbol = case 
        when e.sender = '\\x4ddc2d193948926d02f9b1fe9e1daa0718270ed5' then 'ETH'
        when e.sender = '\\x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e' then 'BAT'
        when e.sender = '\\xf5dce57282a584d2746faf1593d3121fcac444dc' then 'DAI'
        when e.sender = '\\x158079ee67fce2f58472a96584a73c7ab9ac95c1' then 'REP'
        when e.sender = '\\x39aa39c021dfbae8fac545936693ac917d5e7563' then 'USDC'
        when e.sender = '\\xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407' then 'ZRX'
        when e.sender = '\\xc11b1268c1a384e55c48c2391d8d480264a3a7f4' then 'WBTC'
    end       

    where topics[1] = '${BORROW_EVENT}'
` ,

    measures: {
        count: {
            type: `count`,
        },
        borrowAmount_sum: {
            sql: `logged_borrowamount / 
            case 
                when sender = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5' then 1e18
                when sender = '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e' then 1e18
                when sender = '0xf5dce57282a584d2746faf1593d3121fcac444dc' then 1e18
                when sender = '0x158079ee67fce2f58472a96584a73c7ab9ac95c1' then 1e18
                when sender = '0x39aa39c021dfbae8fac545936693ac917d5e7563' then 1e6
                when sender = '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407' then 1e18
                when sender = '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4' then 1e8
            end            
            `,
            type: `sum`,
            title: `Borrow Amount (sum)`,
            format: `currency`
        },
        borrowAmount_avg: {
            sql: `logged_borrowamount / 
            case 
                when sender = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5' then 1e18
                when sender = '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e' then 1e18
                when sender = '0xf5dce57282a584d2746faf1593d3121fcac444dc' then 1e18
                when sender = '0x158079ee67fce2f58472a96584a73c7ab9ac95c1' then 1e18
                when sender = '0x39aa39c021dfbae8fac545936693ac917d5e7563' then 1e6
                when sender = '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407' then 1e18
                when sender = '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4' then 1e8
            end            
            `,
            type: `avg`,
            title: `Borrow Amount (avg)`,
            format: `currency`
        },
        borrowAmount_max: {
            sql: `logged_borrowamount / 
            case 
                when sender = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5' then 1e18
                when sender = '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e' then 1e18
                when sender = '0xf5dce57282a584d2746faf1593d3121fcac444dc' then 1e18
                when sender = '0x158079ee67fce2f58472a96584a73c7ab9ac95c1' then 1e18
                when sender = '0x39aa39c021dfbae8fac545936693ac917d5e7563' then 1e6
                when sender = '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407' then 1e18
                when sender = '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4' then 1e8
            end            
            `,
            type: `max`,
            title: `Borrow Amount (max)`,
            format: `currency`
        },
        borrowAmount_quote_rate: {
            sql: `usd_quote_rate`,
            type: `avg`,
            title: `Borrow (USD quote rate)`,
            format: `currency`
        },
        borrowAmount_sum_quote: {
            sql: `usd_quote`,
            type: `sum`,
            title: `Borrow (sum USD quote)`,
            format: `currency`
        },
        borrowAmount_avg_quote: {
            sql: `usd_quote`,
            type: `avg`,
            title: `Borrow (avg USD quote)`,
            format: `currency`
        },
        borrowAmount_max_quote: {
            sql: `usd_quote`,
            type: `max`,
            title: `Borrow (max USD quote)`,
            format: `currency`
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
        Borrower: {
            sql: `logged_borrower`,
            type: `string`
        },
        BorrowToken: {
            type: `string`,
            case: {
                when: [
                    { sql: `sender = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5'`, label: 'ETH' },
                    { sql: `sender = '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e'`, label: 'BAT' },
                    { sql: `sender = '0xf5dce57282a584d2746faf1593d3121fcac444dc'`, label: 'DAI' },
                    { sql: `sender = '0x158079ee67fce2f58472a96584a73c7ab9ac95c1'`, label: 'REP' },
                    { sql: `sender = '0x39aa39c021dfbae8fac545936693ac917d5e7563'`, label: 'USDC' },
                    { sql: `sender = '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407'`, label: 'ZRX' },
                    { sql: `sender = '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4'`, label: 'WBTC' },
                ]
            }
        },
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }
});
