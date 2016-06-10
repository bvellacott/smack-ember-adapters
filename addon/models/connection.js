import Model from 'ember-data/model';
// import attr from 'ember-data/attr';
// import { belongsTo, hasMany } from 'ember-data/relationships';

export default Model.extend({
	username : DS.attr('string'),
	password : DS.attr('string'),
	didCreate : function() {
		notify('connection created', this);
	},
	didDelete : function() {
		notify('connection deleted', this);
	}
});
