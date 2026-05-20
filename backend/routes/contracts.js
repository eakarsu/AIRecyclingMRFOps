const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'contracts',
  fields: ['contract_id','customer_id','commodity','term_months','status','value_usd','notes'],
});
