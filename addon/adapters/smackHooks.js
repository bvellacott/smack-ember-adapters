import compile from 'npm:smack-js-compiler';

var namespace = {};

var getPackNamespace = function(pack) {
	if(pack === '')
		return namespace;
	if(typeof pack === 'string')
		pack = pack.split('.');
	var current = namespace;
	for(var i = 0; i < pack.length; i++)
		current = current[pack[i]];
	return current;
}

var getFuncNamespace = function(pack) {
	return getPackNamespace(pack)._f;
}

var compileAndReturnAnonymousFunc = function(source, argNames) {
	delete namespace.anonymous;
	var anonFuncSrc = 'pack anonymous;\n func anonymous(' + argNames.join(', ') + ') {\n' + 
	source + '\n' +
	generateReturnObjectAssignSrc('_rEToBJ_', argNames) +
	'\n}';
	var unit = compile(name, anonFuncSrc, namespace);
	console.log(anonFuncSrc);
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
		con.password = null;
	},
}

var beforeCreateHandlers = {
	'connection' : function(connection) {
		connection.session = 'mock session id';
	},
	'compilation-unit' : function(unitRec) {
		var unit = null;
		unit = compile(unitRec.name, unitRec.source, namespace);
		unitRec.pack = unit.pack;
		unitRec.funcNames = unit.funcNames;
	},
	'execute-event' : function(execRec) {
		try {
			var pack = execRec.name.split('.');
			var name = pack.pop();
			var func = getFuncNamespace(pack)[name];
			execRec.result = func.apply(namespace, execRec.arguments);
			execRec.success = true;
		} catch(e) {
			execRec.success = false;
			execRec.errorMessage = e;
		}
	},
	'execute-anonymous-event' : function(execRec) {
		try {
			var args = execRec.arguments;
			var argNames = [];
			var argValues = []
			for(var argName in args) {
				argNames.push(argName);
				argValues.push(args[argName]);
			} 
			var func = compileAndReturnAnonymousFunc(execRec.source, argNames);
			execRec.result = func.apply(namespace, argValues);
			execRec.success = true;
		} catch(e) {
			execRec.success = false;
			execRec.errorMessage = e;
		}
	},
}

var afterCreateHandlers = {
}

var beforeDeleteHandlers = {
	'compilation-unit' : function(unitRec) {
		var funcs = getFuncNamespace(unitRec.pack);
		var funcNames = unitRec.funcNames;
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
	_ns : namespace,
	getPackNamespace : getPackNamespace,
	getFuncNamespace : getFuncNamespace,
	onFind : function(store, type, result, allowRecursive) {
		var handle = findHandlers[type.modelName];
		if(handle) handle(result);
	},
	onFindMany : function(store, type, result, allowRecursive) {
		var handle = findHandlers[type.modelName];
		for(var i = 0; handle && i < result.length; i++)
			handle(result[i]);
	},
	onQuery : function(store, type, result, allowRecursive) {
		var handle = findHandlers[type.modelName];
		for(var i = 0; handle && i < result.length; i++)
			handle(result[i]);
	},
	onFindAll : function(store, type, result) {
		var handle = findHandlers[type.modelName];
		for(var i = 0; handle && i < result.length; i++)
			handle(result[i]);
	},
	beforeCreate : function(store, type, result) {
		var handle = beforeCreateHandlers[type.modelName];
		if(handle) handle(result);
	},
	afterCreate : function(store, type, result) {
		var handle = afterCreateHandlers[type.modelName];
		if(handle) handle(result);
	},
	beforeUpdate : function(store, type, result) {
		var handle = beforeUpdateHandlers[type.modelName];
		if(handle) handle(result);
	},
	afterUpdate : function(store, type, result) {
		var handle = afterUpdateHandlers[type.modelName];
		if(handle) handle(result);
	},
	beforeDelete : function(store, type, result) {
		var handle = beforeDeleteHandlers[type.modelName];
		if(handle) handle(result);
	},
	afterDelete : function(store, type, result) {
		var handle = afterDeleteHandlers[type.modelName];
		if(handle) handle(result);
	},
};
