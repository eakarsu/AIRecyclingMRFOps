const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'bales',
  fields: ['bale_id','commodity','weight_kg','baled_at','grade','status','notes'],
  webhookPrefix: 'bale',
});
