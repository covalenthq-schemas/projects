import { LOG_LOAN_CLOSED, BZX_PROXY } from "./constants";

cube(`LoansClosed`, {
    sql: `
    select 
        block_id,
        block_signed_at,
        '0x' || encode(sender, 'hex') as sender, 

        '0x' || encode(substr(topics[2], 13), 'hex') as logged_lender, 
        '0x' || encode(substr(topics[3], 13), 'hex') as logged_trader,
        '0x' || encode(substr(topics[4], 13), 'hex') as logged_loanOrderHash,

        '0x' || substr(substr(encode(data, 'hex'), 1+(64*0), 64), 25) as logged_loanCloser,
        hex_to_int(substr(encode(data, 'hex'), 1+(64*1), 64)) logged_isLiquidation,
        hex_to_int(substr(encode(data, 'hex'), 1+(64*2), 64)) logged_positionId,

        '0x' || encode(tx_hash, 'hex') as tx_hash,
        gas_offered, gas_spent, gas_price
    from live.block_log_events e
    left join (
        select hash, gas_offered, gas_spent, gas_price 
        from live.block_transactions 
    ) bt
    on bt.hash = e.tx_hash

    where topics[1] = '${LOG_LOAN_CLOSED}'
    and sender = '${BZX_PROXY}'

` ,

    measures: {
        count: {
            type: `count`,
            // drillMembers: [Created, walletAddress, walletLink]
        },

        TransactionCost_Eth: {
            sql: `gas_spent * gas_price / 1e18`,
            type: `sum`,
            title: `Transaction Cost (in ETH)`
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
        Lender: {
            sql: `logged_lender`,
            type: `string`
        },
        Trader: {
            sql: `logged_trader`,
            type: `string`
        },
        LoanCloser: {
            sql: `logged_loanCloser`,
            type: `string`
        },
        isLiquidation: {
            sql: `logged_isLiquidation`,
            type: `number`
        }
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }
});
