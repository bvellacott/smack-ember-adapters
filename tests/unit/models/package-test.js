import { moduleForModel, test } from 'ember-qunit';

moduleForModel('package', 'Unit | Model | package', {
  // Specify the other units that are required for this test.
  needs: [ 'model:compilation-unit' ]
});

test('it exists', function(assert) {
  let model = this.subject();
  // let store = this.store();
  assert.ok(!!model);
});
