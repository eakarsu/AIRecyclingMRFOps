const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'safety_incidents',
  fields: ['incident_id','location','type','severity','opened_at','status','notes'],
  webhookPrefix: 'safety',
});
