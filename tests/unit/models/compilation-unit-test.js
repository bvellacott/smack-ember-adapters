import { moduleForModel, test } from 'ember-qunit';
import Ember from 'ember';
import SmackHooks from 'smack-ember-adapters/adapters/smackHooks';

const {run, get, set} = Ember;

moduleForModel('compilation-unit', 'Unit | Model | compilation unit', {
  // Specify the other units that are required for this test.
  needs: [ 'model:test-datum' ]
});

test('it exists', function(assert) {
  let model = this.subject();
  // let store = this.store();
  assert.ok(!!model);
});

test('beforeCreate - hook', function(t) {
  let model = { name : 'sum', source : 'pack math; func add(a, b) { ret a + b; } func sub(a, b) { ret a - b; }' };

  run(SmackHooks, 'beforeCreate', null, { modelName : 'compilation-unit'}, model);

  t.equal(model.name, 'sum', 'name unchanged');
  t.equal(model.source, 'pack math; func add(a, b) { ret a + b; } func sub(a, b) { ret a - b; }', 'source unchanged');
  t.equal(model.pack, 'math', 'package name set');
  t.deepEqual(model.funcNames, ['add', 'sub'], 'function names set');
  t.equal(typeof SmackHooks.getFuncNamespace('math').add, 'function', 'add function created in the math namespace');
  t.equal(typeof SmackHooks.getFuncNamespace('math').sub, 'function', 'sub function created in the math namespace');
  
  delete SmackHooks.getFuncNamespace('math').add;
  delete SmackHooks.getFuncNamespace('math').sub;
});

test('beforeDelete - hook', function(t) {
  let model = { name : 'sum', source : 'pack math; func add(a, b) { ret a + b; } func sub(a, b) { ret a - b; }' };

  run(SmackHooks, 'beforeCreate', null, { modelName : 'compilation-unit'}, model);
  t.equal(typeof SmackHooks.getFuncNamespace('math').add, 'function', 'add function created in the math namespace');
  t.equal(typeof SmackHooks.getFuncNamespace('math').sub, 'function', 'sub function created in the math namespace');

  run(SmackHooks, 'beforeDelete', null, { modelName : 'compilation-unit'}, model);
  t.equal(typeof SmackHooks.getFuncNamespace('math').add, 'undefined', 'add function removed from the math namespace');
  t.equal(typeof SmackHooks.getFuncNamespace('math').sub, 'undefined', 'sub function removed from the math namespace');
});

test('beforeUpdate - hook', function(t) {
  let model = { name : 'sum', source : 'pack math; func add(a, b) { ret a + b; } func sub(a, b) { ret a - b; }' };

  run(SmackHooks, 'beforeCreate', null, { modelName : 'compilation-unit'}, model);
  model.source ='pack math; func add(a, b) { ret a + b; }';
  run(SmackHooks, 'beforeUpdate', null, { modelName : 'compilation-unit'}, model);

  t.equal(typeof SmackHooks.getFuncNamespace('math').add, 'function', 'add function still in the math namespace');
  t.equal(typeof SmackHooks.getFuncNamespace('math').sub, 'undefined', 'sub function removed from the math namespace');

  model.source = 'pack mathematics; func add(a, b) { ret a + b; }';
  run(SmackHooks, 'beforeUpdate', null, { modelName : 'compilation-unit'}, model);

  t.equal(typeof SmackHooks.getFuncNamespace('math').add, 'undefined', 'add function removed from the math namespace');
  t.equal(typeof SmackHooks.getFuncNamespace('mathematics').add, 'function', 'add function created in the mathematics namespace');

  delete SmackHooks.getFuncNamespace('mathematics').add;
});
