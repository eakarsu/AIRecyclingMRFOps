const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'epr_filings',
  fields: ['filing_id','producer_id','period','jurisdiction','total_units','total_kg','fee_total_usd','submitted_at','status','notes'],
  webhookPrefix: 'epr_filing',
});
