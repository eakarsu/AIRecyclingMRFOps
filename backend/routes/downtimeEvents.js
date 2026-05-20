const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'downtime_events',
  fields: ['event_id','line_id','reason','started_at','ended_at','status','notes'],
  webhookPrefix: 'downtime',
});
