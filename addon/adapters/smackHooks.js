import compile from 'npm:smack-js-compiler';

var namespace = {};

var getPackNamespace = function(pack) {
	if(typeof pack === 'string')
		pack = pack.split('.');
	var current = namespace;
	for(var i = 0; i < pack.length; i++)
		current = current[pack[i]];
	return current._f;
}

var compileAndReturnAnonymousFunc = function(source, argNames) {
	delete namespace.anonymous._f.anonymous;
	var anonFuncSrc = 'pack anonymous;\n func anonymous(' + argNames.join(', ') + ') {\n' + 
	source + '\n' +
	generateReturnObjectAssignSrc('_rEToBJ_', argNames) +
	'\n}';
	var unit = compile(name, anonFuncSrc, namespace);
	return namespace.anonymous._f.anonymous;
}

var generateReturnObjectAssignSrc = function(objName, argNames) {
	var src = objName + ' = {};\n';
	for(var i = 0; i < argNames.length; i++)
		src += objName + '["' + argNames[i] + '"] = ' + argNames[i] + ';\n';
	src += 'ret ' + objName + ';\n';
	return src;
}


var doNothing = function() {};

var findHandlers = {
	connection : function(con) {
		con.set('password', null);
	},
}

var beforeCreateHandlers = {
	'connection' : function(connection) {
		connection.set('session', 'mock session id');
	},
	'compilation-unit' : function(unitRec) {
		var unit = null;
		unit = compile(unitRec.get('name'), unitRec.get('source'), namespace);
		unitRec.set('pack', unit.pack);
		unitRec.set('funcNames', unit.funcNames);
	},
	'execute-event' : function(execRec) {
		try {
			var pack = execRec.get('name').split('.');
			var name = pack.pop();
			var func = getPackNamespace(pack)[name];
			execRec.set('result', func.apply(namespace, execRec.get('arguments')));
		} catch(e) {
			execRec.set('success', false);
			execRec.set('errorMessage', e);
		}
	},
	'execute-anonymous-event' : function(execRec) {
		try {
			var argNames = [];
			var argValues = []
			for(var argName in execRec.get('arguments')) {
				argNames.push(argName);
				argValues.push(args[argName]);
			} 
			var func = compileAndReturnAnonymousFunc(execRec.get('source'), argNames);
			execRec.set('result', func.apply(namespace, argValues));
		} catch(e) {
			execRec.set('success', false);
			execRec.set('errorMessage', e);
		}
	},
}

var afterCreateHandlers = {
}

var beforeDeleteHandlers = {
	'compilation-unit' : function(unitRec) {
		var funcs = getPackNamespace(unitRec.get('pack'));
		var funcNames = unitRec.get('funcNames');
		for(var i = 0; i < funcNames.length; i++)
			delete funcs[funcNames[i]];
	},
}

var afterDeleteHandlers = {
}

var beforeUpdateHandlers = {
	'compilation-unit' : function(unitRec) {
		beforeDeleteHandlers['compilation-unit'](unitRec);
		beforeCreateHandlers['compilation-unit'](unitRec);
	},
}

var afterUpdateHandlers = {
}

export default {
	getPackNamespace : getPackNamespace,
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
		if(handle) handle(result);
	},
	afterCreate : function(store, type, result) {
		var handle = afterCreateHandlers[type];
		if(handle) handle(result);
	},
	beforeUpdate : function(store, type, result) {
		var handle = beforeUpdateHandlers[type];
		if(handle) handle(result);
	},
	afterUpdate : function(store, type, result) {
		var handle = afterUpdateHandlers[type];
		if(handle) handle(result);
	},
	beforeDelete : function(store, type, result) {
		var handle = beforeDeleteHandlers[type];
		if(handle) handle(result);
	},
	afterDelete : function(store, type, result) {
		var handle = afterDeleteHandlers[type];
		if(handle) handle(result);
	},
};
