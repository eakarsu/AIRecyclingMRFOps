const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'operators',
  fields: ['op_id','name','shift','line_id','status','contact','notes'],
});
