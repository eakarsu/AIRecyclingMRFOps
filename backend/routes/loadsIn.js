const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'loads_in',
  fields: ['load_id','hauler','weight_tons','contamination_pct','arrived_at','status','notes'],
  webhookPrefix: 'load',
});
