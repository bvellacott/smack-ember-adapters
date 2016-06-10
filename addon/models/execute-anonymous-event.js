import Model from 'ember-data/model';
// import attr from 'ember-data/attr';
// import { belongsTo, hasMany } from 'ember-data/relationships';

export default Model.extend({
	source : DS.attr('string'),
	arguments : DS.attr(),
	didCreate : function() {
		notify('execute anonymous event created', this);
	}
});
