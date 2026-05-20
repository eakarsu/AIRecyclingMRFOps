const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'drivers',
  fields: ['driver_id','name','license','base','last_run','status','notes'],
});
