import { moduleForModel, test } from 'ember-qunit';
import Ember from 'ember';
import SmackHooks from 'smack-ember-adapters/adapters/smackHooks';

moduleForModel('compilation-unit', 'Unit | Model | compilation unit', {
  // Specify the other units that are required for this test.
  needs: [ 'model:test-datum' ]
});

test('it exists', function(assert) {
  let model = this.subject();
  // let store = this.store();
  assert.ok(!!model);
});

test('on find', function(assert) {
  let model = this.subject();
  SmackHooks.onFind();
  assert.ok(!!model);
  // let store = this.store();
  // Ember.run(model, 'save');
  // console.log(model);
  // Ember.run(store, 'findRecord', 'compilation-unit', model._id).then(unit => {
  //   assert.ok(unit.get('id'), 'id is loaded correctly');
    // assert.equal(get(list, 'name'), 'one', 'name is loaded correctly');
    // assert.equal(get(list, 'done'), true, 'done is loaded correctly');
  //   done();
  // });
});
