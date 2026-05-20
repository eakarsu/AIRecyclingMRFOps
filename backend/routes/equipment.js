const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'equipment',
  fields: ['eq_id','name','line_id','vendor','last_service','status','notes'],
});
