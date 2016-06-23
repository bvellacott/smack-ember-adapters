import Ember from 'ember';
import { moduleForModel, test } from 'ember-qunit';
import SmackHooks from 'smack-ember-adapters/adapters/smackHooks';

const {run, get, set} = Ember;

moduleForModel('connection', 'Unit | Model | connection', {
  // Specify the other units that are required for this test.
  needs: []
});

test('it exists', function(assert) {
  let model = this.subject();
  // let store = this.store();
  assert.ok(!!model);
});

test('onFind - hook', function(t) {
  SmackHooks.setNamespace({});
  let model = { username : 'dude', password : 'IL0veMum', session : 'session 123' };
  run(SmackHooks, 'onFind', null, { modelName : 'connection'}, model);
  t.equal(model.username, 'dude', 'username unchanged');
  t.notOk(model.password, 'password hidden');
  t.equal(model.session, 'session 123', 'session unchanged');
  SmackHooks.setNamespace({});
});

test('beforeCreate - hook', function(t) {
  SmackHooks.setNamespace({});
  let model = { username : 'dude', password : 'IL0veMum' };
  run(SmackHooks, 'beforeCreate', null, { modelName : 'connection'}, model);
  t.equal(model.username, 'dude', 'username unchanged');
  t.equal(model.password, 'IL0veMum', 'password unchanged');
  t.ok(!!model.session, 'session id created');
  SmackHooks.setNamespace({});
});
