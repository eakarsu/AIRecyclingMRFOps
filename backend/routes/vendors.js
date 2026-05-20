const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'vendors',
  fields: ['vendor_id','name','service','country','rating','status','notes'],
});
