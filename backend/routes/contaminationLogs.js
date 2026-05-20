const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'contamination_logs',
  fields: ['log_id','load_id','type','severity','found_by','ts','notes'],
  webhookPrefix: 'contamination',
});
