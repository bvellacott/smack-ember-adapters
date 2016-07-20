import { moduleForModel, test } from 'ember-qunit';
import Ember from 'ember';
import SmackHooks from 'smack-ember-adapters/adapters/smackHooks';

const {run, get, set} = Ember;

moduleForModel('compilation-unit', 'Unit | Model | compilation unit', {
  // Specify the other units that are required for this test.
  needs: [ 'model:test-datum', 'model:package' ]
});

test('it exists', function(assert) {
  let model = this.subject();
  // let store = this.store();
  assert.ok(!!model);
});

test('beforeCreate - hook', function(t) {
  SmackHooks.setNamespace({ math: { _f: {} }});
  let model = { name : 'sum', pack: 'p', source : 'func add(a, b) { ret a + b; } func sub(a, b) { ret a - b; }' };
  var hash = { package: { records: {
    'p': { name: 'math' }
  }}};

  run(SmackHooks, 'beforeCreate', hash, { modelName : 'compilation-unit'}, model);

  t.equal(model.name, 'sum', 'name unchanged');
  t.equal(model.source, 'func add(a, b) { ret a + b; } func sub(a, b) { ret a - b; }', 'source unchanged');
  t.deepEqual(model.funcNames, ['add', 'sub'], 'function names set');
  t.equal(typeof SmackHooks.getFuncNamespace('math').add, 'function', 'add function created in the math namespace');
  t.equal(typeof SmackHooks.getFuncNamespace('math').sub, 'function', 'sub function created in the math namespace');

  SmackHooks.setNamespace({});
});

test('beforeDelete - hook', function(t) {
  SmackHooks.setNamespace({ math: { _f: {} }});
  let model = { id: '1', name : 'sum', pack: 'p', source : 'func add(a, b) { ret a + b; } func sub(a, b) { ret a - b; }' };
  var hash = {
    'package': { records: { 'p': { name: 'math' } }},
    'compilation-unit': { records: {} }
  };

  run(SmackHooks, 'beforeCreate', hash, { modelName : 'compilation-unit'}, model);
  hash['compilation-unit'].records['1'] = {
    id: '1', name : 'sum', pack: 'p',
    source : 'func add(a, b) { ret a + b; } func sub(a, b) { ret a - b; }',
    funcNames: ['add', 'sub']
  };
  t.equal(typeof SmackHooks.getFuncNamespace('math').add, 'function', 'add function created in the math namespace');
  t.equal(typeof SmackHooks.getFuncNamespace('math').sub, 'function', 'sub function created in the math namespace');

  run(SmackHooks, 'beforeDelete', hash, { modelName : 'compilation-unit'}, model);
  t.equal(typeof SmackHooks.getFuncNamespace('math').add, 'undefined', 'add function removed from the math namespace');
  t.equal(typeof SmackHooks.getFuncNamespace('math').sub, 'undefined', 'sub function removed from the math namespace');
  SmackHooks.setNamespace({});
});

test('beforeUpdate - hook', function(t) {
  SmackHooks.setNamespace({ math: { _f: {} }, mathematics: { _f: {} }});
  let model = { id: '1', name : 'sum', pack: 'p1', source : 'func add(a, b) { ret a + b; } func sub(a, b) { ret a - b; }' };
  var hash = {
    'package': { records: { 'p1': { name: 'math' }, 'p2': { name: 'mathematics' } }},
    'compilation-unit': { records: {}}
  };

  run(SmackHooks, 'beforeCreate', hash, { modelName : 'compilation-unit'}, model);
  hash['compilation-unit'].records[model.id] = { name: 'sum', pack: 'p1', funcNames: ['add', 'sub'] };
  model.source ='func add(a, b) { ret a + b; }';
  run(SmackHooks, 'beforeUpdate', hash, { modelName : 'compilation-unit'}, model);

  t.equal(typeof SmackHooks.getFuncNamespace('math').add, 'function', 'add function still in the math namespace');
  t.equal(typeof SmackHooks.getFuncNamespace('math').sub, 'undefined', 'sub function removed from the math namespace');

  model.pack = 'p2';
  model.source = 'func add(a, b) { ret a + b; }';
  run(SmackHooks, 'beforeUpdate', hash, { modelName : 'compilation-unit'}, model);

  t.equal(typeof SmackHooks.getFuncNamespace('math').add, 'undefined', 'add function removed from the math namespace');
  t.equal(typeof SmackHooks.getFuncNamespace('mathematics').add, 'function', 'add function created in the mathematics namespace');

  delete SmackHooks.getFuncNamespace('mathematics').add;
  SmackHooks.setNamespace({});
});
