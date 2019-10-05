import { BORROW_EVENT, REPAY_BORROW_EVENT } from "./constants";

cube(`Borrows`, {
    sql: `
    select 
        block_id,
        block_signed_at,
        '0x' || encode(sender, 'hex') as sender, 
        '0x' || substr(substr(encode(data, 'hex'), 1+(64*0), 64), 25) as logged_borrower,
        hex_to_int(substr(encode(data, 'hex'), 1+(64*1), 64)) as logged_borrowamount,
        hex_to_int(substr(encode(data, 'hex'), 1+(64*2), 64)) as logged_accountborrows,
        hex_to_int(substr(encode(data, 'hex'), 1+(64*3), 64)) as logged_totalborrows,
        '0x' || encode(tx_hash, 'hex') as tx_hash
    from live.block_log_events e

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
            title: `Borrow Amount (SUM)`,
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
            title: `Borrow Amount (AVG)`,
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
            title: `Borrow Amount (MAX)`,
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
