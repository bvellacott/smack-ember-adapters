import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';

export default Model.extend({
	name : attr('string'),
	pack : belongsTo('package', { inverse: 'units' }),
	funcNames : attr(),
	source : attr('string'),
	testData : hasMany('testDatum')
});
