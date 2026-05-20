const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'prices',
  fields: ['price_id','comm_id','market','value_usd_ton','ts','source','notes'],
});
