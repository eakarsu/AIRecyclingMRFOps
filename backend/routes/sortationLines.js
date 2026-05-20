const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'sortation_lines',
  fields: ['line_id','name','throughput_tph','status','last_event','operator','notes'],
});
