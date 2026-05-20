const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'loads_out',
  fields: ['out_id','bale_id','customer_id','weight_kg','shipped_at','status','notes'],
  webhookPrefix: 'shipment',
});
