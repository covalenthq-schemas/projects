import { AUGUR_CONTRACT, MARKET_CREATED_EVENT } from "./constants";

cube(`Markets`, {
    sql: `

select 
convert_from(decode(substr(substr(encode(data, 'hex'), 1+(64*9), 64*(dl/32+1)::int), 0, (dl*2)::int + 1), 'hex'), 'utf-8') as description,
*
from (
    select
        block_id,
        block_signed_at,
        block_height,
        '0x' || encode(tx_hash, 'hex') as "tx_hash",
        convert_from(decode( replace(  encode(e.topics[2], 'hex') , '00', ''), 'hex'), 'utf-8') as "logged_topic"
        , '0x' || substr(encode(e.topics[3], 'hex'), 25) as "logged_universe"
        , '0x' || substr(encode(e.topics[4], 'hex'), 25) as "logged_marketcreator"

        , '0x' || substr(substr(encode(e.data,'hex'), 1+(64*2), 64), 25) as "logged_market"

        , hex_to_int(substr(encode(e.data,'hex'), 1+(64*8), 64)) as "dl"
        , data
    from
        live.block_log_events e

    where
        e.topics[1] = '${MARKET_CREATED_EVENT}'
        and e.sender = '${AUGUR_CONTRACT}'  
) x
` ,

    measures: {
        count: {
            type: `count`,
            // drillMembers: [Created, walletAddress, walletLink]
        },
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
        topic: {
            sql: `logged_topic`,
            type: `string`
        },
        market: {
            sql: `logged_market`,
            type: `string`
        },
        universe: {
            sql: `logged_universe`,
            type: `string`
        },
        marketCreator: {
            sql: `logged_marketcreator`,
            type: `string`
        },
        description: {
            sql: `description`,
            type: `string`
        }
    },
    // preAggregations: {
    //     main: {
    //         type: `originalSql`
    //     }
    // }
});
