const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'sku_obligations',
  fields: ['sku_id','producer_id','sku_description','material_category','unit_weight_g','fee_usd_unit','jurisdiction','status','notes'],
  webhookPrefix: 'sku_obligation',
});
