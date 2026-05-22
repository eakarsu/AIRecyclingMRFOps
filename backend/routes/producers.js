const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'producers',
  fields: ['producer_id','name','jurisdiction','contact','status','notes'],
  webhookPrefix: 'producer',
});
