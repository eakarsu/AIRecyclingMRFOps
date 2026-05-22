const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'scale_tickets',
  fields: ['ticket_id','load_id','direction','hauler','vehicle_plate','gross_kg','tare_kg','net_kg','weighed_at','scale_house','operator','status','notes'],
  webhookPrefix: 'scale_ticket',
});
