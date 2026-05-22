const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'buyer_specs',
  fields: ['spec_id','buyer_id','commodity','isri_grade','max_contamination_pct','min_density_kg_m3','min_bale_weight_kg','price_usd_ton','monthly_demand_tons','status','notes'],
  webhookPrefix: 'buyer_spec',
});
