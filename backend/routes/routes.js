const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'routes',
  fields: ['route_id','name','driver_id','vehicle_id','scheduled_date','distance_km','duration_hours','fill_pct','status','notes'],
  webhookPrefix: 'route',
});
