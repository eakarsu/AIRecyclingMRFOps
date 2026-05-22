const buildCrud = require('./_crudFactory');

module.exports = buildCrud({
  table: 'buyers',
  fields: ['buyer_id','name','country','region','contact','certifications','status','notes'],
  webhookPrefix: 'buyer',
});
