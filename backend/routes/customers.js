const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'customers',
  fields: ['customer_id','name','country','commodity','contract_id','status','notes'],
});
