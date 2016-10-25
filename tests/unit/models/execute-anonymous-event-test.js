import Ember from 'ember';
import { moduleForModel, test } from 'ember-qunit';
import SmackHooks from 'smack-ember-adapters/adapters/smackHooks';

const {run} = Ember;

moduleForModel('execute-anonymous-event', 'Unit | Model | execute anonymous event', {
  // Specify the other units that are required for this test.
  needs: []
});

test('it exists', function(assert) {
  let model = this.subject();
  // let store = this.store();
  assert.ok(!!model);
});

test('beforeCreate - hook - execute 1 + 1', function(t) {
  SmackHooks.setNamespace({});
  let model = { source : 'c = a + b;', arguments : { a : 1, b : 1, c : 0 }};
  run(SmackHooks, 'beforeCreate', null, { modelName : 'execute-anonymous-event' }, model);
  t.deepEqual(model.result, { a : 1, b : 1, c : 2 }, 'execution result');
  t.ok(model.success, 'success status');
  SmackHooks.setNamespace({});
});

test('beforeCreate - hook - error', function(t) {
  SmackHooks.setNamespace({});
  let model = { source : 'nonexistent["property"] = 1;', arguments : {}};
  run(SmackHooks, 'beforeCreate', null, { modelName : 'execute-anonymous-event' }, model);
  t.notOk(model.success, 'success status');
  t.ok(model.errorMessage, 'error message');
  SmackHooks.setNamespace({});
});
