import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';

export default Model.extend({
	name: attr('string'),
	parent: belongsTo('package', { inverse: 'children' }),
	children: hasMany('package', { inverse: 'parent' }),
	units: hasMany('compilation-unit', { inverse: 'pack' }),
});
