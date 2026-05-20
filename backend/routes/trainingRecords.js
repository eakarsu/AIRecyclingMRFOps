const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'training_records',
  fields: ['record_id','op_id','topic','completed_at','score','status','notes'],
});
