const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'route_stops',
  fields: ['stop_id','route_id','sequence','address','client','est_tons','arrival_eta','status','notes'],
  webhookPrefix: 'route_stop',
});
