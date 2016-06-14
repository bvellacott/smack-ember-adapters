import compile from 'npm:smack-js-compiler';

var namespace = {};

var doNothing = function() {};

var findHandlers = {
	connection = function(con) {
		con.set('password', null);
	},
}

var beforeCreateHandlers = {
	connection : function(connection) {
		connection.set('session', 'mock session id');
	},
}

var afterCreateHandlers = {
}

var beforeUpdateHandlers = {
}

var afterUpdateHandlers = {
}

var beforeDeleteHandlers = {
}

var afterDeleteHandlers = {
}

export default {
	onFind : function(store, type, result, allowRecursive) {
		var handle = findHandlers[type];
		if(handle) handle(result);
	},
	onFindMany : function(store, type, result, allowRecursive) {
		var handle = findHandlers[type];
		for(var i = 0; handle && i < result.length; i++)
			handle(result[i]);
	},
	onQuery : function(store, type, result, allowRecursive) {
		var handle = findHandlers[type];
		for(var i = 0; handle && i < result.length; i++)
			handle(result[i]);
	},
	onFindAll : function(store, type, result) {
		var handle = findHandlers[type];
		for(var i = 0; handle && i < result.length; i++)
			handle(result[i]);
	},
	beforeCreate : function(store, type, result) {
		var handle = beforeCreateHandlers[type];
		for(var i = 0; handle && i < result.length; i++)
			handle(result[i]);
	},
	afterCreate : function(store, type, result) {
		var handle = afterCreateHandlers[type];
		for(var i = 0; handle && i < result.length; i++)
			handle(result[i]);
	},
	beforeUpdate : function(store, type, result) {
		var handle = beforeUpdateHandlers[type];
		for(var i = 0; handle && i < result.length; i++)
			handle(result[i]);
	},
	afterUpdate : function(store, type, result) {
		var handle = afterUpdateHandlers[type];
		for(var i = 0; handle && i < result.length; i++)
			handle(result[i]);
	},
	beforeDelete : function(store, type, result) {
		var handle = beforeDeleteHandlers[type];
		for(var i = 0; handle && i < result.length; i++)
			handle(result[i]);
	},
	afterDelete : function(store, type, result) {
		var handle = afterDeleteHandlers[type];
		for(var i = 0; handle && i < result.length; i++)
			handle(result[i]);
	},
};
