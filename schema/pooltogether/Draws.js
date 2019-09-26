import { OPENED, PT_CONTRACT } from "./constants";

cube(`Draws`, {
    sql: `
select
  block_signed_at,
  encode(topics[2], 'hex') as "drawId",
  encode(topics[3], 'hex') as "feeBeneficiary",
  encode(topics[5], 'hex') as "feeFraction"
from
  live.block_log_events e

where
e.topics[1] = '${OPENED}'
and e.sender = '${PT_CONTRACT}'  
` ,
    measures: {
        count: {
            type: `count`,
        },
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
        drawId: {
            sql: `${CUBE}."drawId"`,
            type: `string`
        }
    }
});
