const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'commodities',
  fields: ['comm_id','name','current_price_usd_ton','currency','last_updated','status','notes'],
});
