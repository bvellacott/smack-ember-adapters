import Model from 'ember-data/model';
import attr from 'ember-data/attr';
// import { belongsTo, hasMany } from 'ember-data/relationships';

export default Model.extend({
	name : attr('string'),
	arguments : attr(),
	result : attr(),
	success : attr('boolean'),
	errorMessage : attr('string')
});
