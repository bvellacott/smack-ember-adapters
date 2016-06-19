import DS from 'ember-data';
import attr from 'ember-data/attr';
// import { belongsTo, hasMany } from 'ember-data/relationships';

export default DS.Model.extend({
	username : attr('string'),
	password : attr('string'),
	session : attr('string')
});
