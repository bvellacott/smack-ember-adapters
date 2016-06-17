import Ember from 'ember';
import { moduleForModel, test } from 'ember-qunit';
import SmackHooks from 'smack-ember-adapters/adapters/smackHooks';

const {run, get, set} = Ember;

moduleForModel('execute-event', 'Unit | Model | execute event', {
  // Specify the other units that are required for this test.
  needs: []
});

test('it exists', function(assert) {
  let model = this.subject();
  // let store = this.store();
  assert.ok(!!model);
});

test('beforeCreate - hook - execute 1 + 1', function(t) {
  SmackHooks.getPackNamespace('')['math'] = { _f : {
  	add : function(a, b) { return a + b }
  }};
  let model = this.subject({ name : 'math.add', arguments : [1, 1] });
  run(SmackHooks, 'beforeCreate', null, 'execute-event', model);
  t.equal(model.get('result'), 2, 'execution result');
  t.ok(model.get('success'), 'success status');
  delete SmackHooks.getPackNamespace('')['math'];
});

test('beforeCreate - hook - error', function(t) {
  SmackHooks.getPackNamespace('')['math'] = { _f : {
  	error : function() { throw 'deliberate error'; }
  }};
  let model = this.subject({ name : 'math.error' });
  run(SmackHooks, 'beforeCreate', null, 'execute-event', model);
  t.notOk(model.get('success'), 'success status');
  t.equal(model.get('errorMessage'), 'deliberate error', 'error message');
  delete SmackHooks.getPackNamespace('')['math'];
});
