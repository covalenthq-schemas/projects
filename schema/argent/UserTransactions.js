import { CRYPTO_EPOCH, WALLET_CREATED, FACTORY } from "./constants";

cube(`UserTransactions`, {
    sql: `
  select
      to_timestamp(${CRYPTO_EPOCH} + (block_id >> 32))::timestamp at time zone 'UTC' as block_signed_at,
      '0x' || encode("to", 'hex') as to_address,
      to_timestamp( ${CRYPTO_EPOCH} +  (last_value(block_id) over (partition by "to") >> 32 )  )
      at time zone 'UTC' 
      as last_seen_at
  from
      live.block_transactions t
  where "to" in (
    select substr(e.data, 13, 20) from 
    live.block_log_events e
    where
    e.topics[1] = '${WALLET_CREATED}'
    and e.sender = '${FACTORY}'    )
` ,

    measures: {
        count: {
            type: `count`,
            drillMembers: []
        }
    },

    dimensions: {
        blockSignedAt: {
            sql: `${CUBE}.block_signed_at`,
            type: `time`
        },
        toAddress: {
            sql: `to_address`,
            primaryKey: true,
            type: `string`
        },
        LastSeenAt: {
            sql: `${CUBE}.last_seen_at`,
            type: `time`
        }
    },
    preAggregations: {
        main: {
            type: `originalSql`
        }
    }
});

