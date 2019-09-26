import { CRYPTO_EPOCH, CREATED_EVENT, INSTADAPP_REGISTRY } from "./constants";

cube(`UserTransactions`, {
    sql: `
with userwallets as (
    select 
    substr(e.data , 13 ) as "logged_proxy"
    from
        live.block_log_events e
    where
        e.topics[1] = '${CREATED_EVENT}'
        and e.sender = '${INSTADAPP_REGISTRY}'  
  )

  select
      to_timestamp(${CRYPTO_EPOCH} + (block_id >> 32))::timestamp at time zone 'UTC' as block_signed_at,
      '0x' || encode("to", 'hex') as to_address,
      to_timestamp( ${CRYPTO_EPOCH} +  (last_value(block_id) over (partition by "to") >> 32 )  )
      at time zone 'UTC' 
      as last_seen_at
  from
      live.block_transactions t
  where "to" in (
    select logged_proxy from userwallets
  )
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
