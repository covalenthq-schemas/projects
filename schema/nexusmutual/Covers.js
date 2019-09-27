import { QUOTATION_DATA_CONTRACT, COVER_DETAILS_EVENT } from "./constants";

cube(`Covers`, {
    sql: `
with prices as (
    select symbol, price from crawl.prices
    where base = 'USD' and symbol in ('ETH', 'DAI') 
    and date = current_date
)        
select
    block_id,
    block_signed_at,
    block_height,
    '0x' || encode(tx_hash, 'hex') as "tx_hash",
    '0x' || substr(encode(e.topics[1], 'hex'), 25) as "logged_sender"

    , hex_to_int(encode(e.topics[2], 'hex')) as "logged_cid"

    , '0x' || substr(substr(encode(e.data,'hex'), 1+(64*0), 64), 25) as "logged_scadd"
    , hex_to_int(substr(encode(e.data,'hex'), 1+(64*1), 64)) as "logged_sumassured"
    , to_timestamp(hex_to_int(substr(encode(e.data,'hex'), 1+(64*2),64))) as "logged_expiry"
--    , hex_to_int(substr(encode(e.data,'hex'), 1+(64*3),64)) as "logged_premium"
--    , hex_to_int(substr(encode(e.data,'hex'),1 +(64*4),64)) as "logged_premiumNXM"
   , substr(encode(e.data,'hex'),1 +(64*5),64) as "logged_curr"
   , p.price as curr_price
from
    live.block_log_events e

left join prices p 
    on p.symbol = case 
    when substr(encode(e.data,'hex'),1+(64*5),64) = '4441490000000000000000000000000000000000000000000000000000000000' 
        then 'ETH'
    when substr(encode(e.data,'hex'),1+(64*5),64) = '4554480000000000000000000000000000000000000000000000000000000000' 
        then 'DAI'
    end

where
    e.topics[1] = '${COVER_DETAILS_EVENT}'
    and e.sender = '${QUOTATION_DATA_CONTRACT}'  
` ,

    measures: {
        count: {
            type: `count`,
            // drillMembers: [Created, walletAddress, walletLink]
        },
        // growth_rate: {
        //     type: `number`,
        //     format: `percent`,
        //     sql: `coalesce(  (${count} * 1.0 / lag(nullif( ${count}, 0) , 1) over ()) - 1.0 , 0)`
        // }
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
        coverId: {
            sql: `logged_cid`,
            type: `number`
        },
        smartContractAddress: {
            sql: `logged_scadd`,
            type: `string`
        },
        smartContractAddressLink: {
            sql: `'https://etherscan.io/address/' || logged_scadd`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        },
        smartContractName: {
            // sql: `logged_scadd`,
            type: `string`,
            case: {
                when: [
                    { sql: `logged_scadd = '0x448a5065aebb8e423f0896e6c5d525c040f59af3'`, label: 'Maker' },
                    { sql: `logged_scadd = '0x802275979b020f0ec871c5ec1db6e412b72ff20b'`, label: "Nuo" },
                    { sql: `logged_scadd = '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b'`, label: "Compound" },
                    { sql: `logged_scadd = '0x1e0447b19bb6ecfdae1e4ae1694b0c3659614e4e'`, label: "dYdX" },
                    { sql: `logged_scadd = '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'`, label: "Maker Token" },
                    { sql: `logged_scadd = '0x514910771af9ca656af840dff83e8264ecf986ca'`, label: "ChainLink Token" },
                    { sql: `logged_scadd = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5'`, label: "cETH" },
                    { sql: `logged_scadd = '0x802275979b020f0ec871c5ec1db6e412b72ff20b'`, label: "Totle" },
                    { sql: `logged_scadd = '0xc0a47dfe034b400b47bdad5fecda2621de6c4d95'`, label: "Uniswap" },
                    { sql: `logged_scadd = '0x6e95c8e8557abc08b46f3c347ba06f8dc012763f'`, label: "Gnosis MultiSig" },
                    { sql: `logged_scadd = '0xb1dd690cc9af7bb1a906a9b5a94f94191cc553ce'`, label: "BaseWallet Unknown" },
                    { sql: `logged_scadd = '0x498b3bfabe9f73db90d252bcd4fa9548cd0fd981'`, label: "InstaDApp" },
                    { sql: `logged_scadd = '0x1b75b90e60070d37cfa9d87affd124bb345bf70a'`, label: "Edgeware" },
                    { sql: `logged_scadd = '0xbda109309f9fafa6dd6a9cb9f1df4085b27ee8ef'`, label: "Maker" },
                    { sql: `logged_scadd = '0x8573f2f5a3bd960eee3d998473e50c75cdbe6828'`, label: "Minter Unknown" },
                    { sql: `logged_scadd = '0xcd2053679de3bcf2b7e2c2efb6b499c57701222c'`, label: "Totle Primary" },
                    { sql: `logged_scadd = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'`, label: "Wrapped Ether" },
                ],
                else: {
                    label: 'Other'
                }
            }
        },
        coverAmount: {
            sql: `logged_sumassured`,
            type: `number`
        },
        TxHashLink: {
            sql: `'https://etherscan.io/tx/' || "tx_hash"`,
            type: `string`,
            format: {
                label: `Etherscan`,
                type: `link`
            }
        },
        coverCurrency: {
            // sql: `logged_curr`,
            type: `string`,
            case: {
                when: [
                    { sql: `logged_curr = '4441490000000000000000000000000000000000000000000000000000000000'`, label: 'ETH' },
                    { sql: `logged_curr = '4554480000000000000000000000000000000000000000000000000000000000'`, label: 'DAI' },
                ],
                else: {
                    label: `Handle me`
                }
            }
        },
        coverAmountQuote: {
            sql: `curr_price * logged_sumassured`,
            type: `number`,
            format: `currency`
        },
        expiry: {
            sql: `logged_expiry`,
            type: `string`
        }
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }
});
