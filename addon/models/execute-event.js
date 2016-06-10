import Model from 'ember-data/model';
// import attr from 'ember-data/attr';
// import { belongsTo, hasMany } from 'ember-data/relationships';

export default Model.extend({
	name : DS.attr('string'),
	arguments : DS.attr(),
	didCreate : function() {
		notify('execute event created', this);
	}
});
