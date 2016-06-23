import { moduleForModel, test } from 'ember-qunit';

moduleForModel('test-datum', 'Unit | Model | test datum', {
  // Specify the other units that are required for this test.
  needs: [ 'model:compilation-unit' ]});

test('it exists', function(assert) {
  let model = this.subject();
  // let store = this.store();
  assert.ok(!!model);
});
