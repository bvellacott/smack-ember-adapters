import setupStore from 'dummy/tests/helpers/store';
import Ember from 'ember';
import FIXTURES from 'dummy/tests/helpers/smack-model-fixtures';
import LSAdapter from 'smack-ember-adapters/adapters/ls-adapter';

// hooks
import SmackHooks from 'smack-ember-adapters/adapters/smackHooks';

// models
import Connection from 'smack-ember-adapters/models/connection';
import Package from 'smack-ember-adapters/models/package';
import CompilationUnit from 'smack-ember-adapters/models/compilation-unit';
import ExecuteEvent from 'smack-ember-adapters/models/execute-event';
import ExecuteAnonymousEvent from 'smack-ember-adapters/models/execute-anonymous-event';
import TestDatum from 'smack-ember-adapters/models/test-datum';


import {module, test} from 'qunit';
const {run, get} = Ember;

let env, store;

module('smack model hooks', {
  beforeEach() {
    localStorage.setItem('DS.LSAdapter', JSON.stringify(FIXTURES));

    env = setupStore({
      'connection': Connection,
      'package': Package,
      'compilation-unit': CompilationUnit,
      'execute-event': ExecuteEvent,
      'execute-anonymous-event': ExecuteAnonymousEvent,
      'test-datum': TestDatum,
      adapter: LSAdapter
    });
    store = env.store;
    SmackHooks.setNamespace({});
  },

  afterEach() {
    run(store, 'destroy');
    SmackHooks.setNamespace({});
  }
});

test('exists through the store', function(assert) {
  const lsAdapter = store.adapterFor('-default');
  const lsSerializer = store.serializerFor('-default');
  assert.ok(lsAdapter, 'LSAdapter exists');
  assert.ok(lsSerializer, 'LSSerializer exists');
});

test('connection create and find - hook', function(t) {
  t.expect(6);
  // const list = run(store, 'createRecord', 'list', {name: 'Rambo'});
  var connection = run(store, 'createRecord', 'connection', { username : 'dude', password : 'IL0veMum' });
  t.equal(get(connection, 'username'), 'dude', 'username unchanged');
  t.equal(get(connection, 'password'), 'IL0veMum', 'password unchanged');
  // t.ok(!!get(connection, 'session'), 'session id created');

  const done = t.async();
  run(connection, 'save').then(() => {
    store.query('connection', 'where username = "dude"').then(records => {
      let con = records.objectAt(0);
      t.equal(get(con, 'id'), get(connection, 'id'), 'id unchanged');
      t.equal(get(con, 'username'), 'dude', 'username unchanged');
      t.notOk(get(con, 'password'), 'password hidden');
      t.ok(get(con, 'session'), 'session id created');
      done();
    });
  });
});

test('package create and delete', function(t){
  t.expect(7);
  const done = t.async();

  var parentPack = run(store, 'createRecord', 'package', { name : 'parent'});

  run(parentPack, 'save').then(() => {
    t.ok(parentPack.id, 'parent package has an id');
    t.ok(SmackHooks.getPackNamespace('parent'), 'parent package created in the namespace');
    var childPack = run(store, 'createRecord', 'package', { name : 'child' });
    childPack.set('parent', parentPack);

    run(childPack, 'save').then(() => {
      t.ok(childPack.id, 'child package has an id');
      t.ok(SmackHooks.getPackNamespace('parent.child'), 'child package created in the namespace');
      var grandChildPack = run(store, 'createRecord', 'package', { name : 'grandChild' });
      grandChildPack.set('parent', childPack);

      run(grandChildPack, 'save').then(() => {
        t.ok(grandChildPack.id, 'grand child package has an id');
        t.ok(SmackHooks.getPackNamespace('parent.child.grandChild'), 'grandChild package created in the namespace');
        run(parentPack, 'destroyRecord').then(() => {
          run(store, 'findAll', 'package').then(packs => {
            run(store, 'unloadAll', 'package');
            t.equal(get(packs, 'length'), 0, 'all packages were deleted');
            done();
          });
        });
      });
    });
  });
  run(store, 'createRecord', 'package', { name : 'parent'});
});

test('compilation-unit create, update and delete', function(t) {
  t.expect(16);
  const done = t.async();

  // create
  var mathPack = run(store, 'createRecord', 'package', { name : 'math'});
  run(mathPack, 'save').then(() => {
    var mathSumsPack = run(store, 'createRecord', 'package', { name : 'sums'});
    mathSumsPack.set('parent', mathPack);
    run(mathSumsPack, 'save').then(() => {
      var unit = run(store, 'createRecord', 'compilation-unit',
          { name : 'sum', pack: mathPack, source : 'func add(a, b) { ret a + b; } func sub(a, b) { ret a - b; }' });
      run(unit, 'save').then(() => {
        t.equal(get(unit, 'name'), 'sum', 'name unchanged');
        t.equal(get(unit, 'source'), 'func add(a, b) { ret a + b; } func sub(a, b) { ret a - b; }', 'source unchanged');
        t.equal(get(get(unit, 'pack'), 'id'), get(mathPack, 'id'), 'package set');
        t.deepEqual(get(unit, 'funcNames'), ['add', 'sub'], 'function names set');
        t.equal(typeof SmackHooks.getFuncNamespace('math').add, 'function', 'add function created in the math namespace');
        t.equal(typeof SmackHooks.getFuncNamespace('math').sub, 'function', 'sub function created in the math namespace');

        run(unit, 'set', 'source', 'func add(a, b) { ret a + b; } func error() { nonexistent[param] = 1; }');
        run(unit, 'set', 'pack', mathSumsPack);

        run(unit, 'save').then(unit => {
          t.equal(get(unit, 'name'), 'sum', 'name unchanged');
          t.equal(get(unit, 'source'), 'func add(a, b) { ret a + b; } func error() { nonexistent[param] = 1; }', 'source updated');
          t.equal(get(get(unit, 'pack'), 'id'), get(mathSumsPack, 'id'), 'package updated');
          t.deepEqual(get(unit, 'funcNames'), ['add', 'error'], 'function names updated');
          t.equal(typeof SmackHooks.getFuncNamespace('math.sums').add, 'function', 'add function moved to the math.sums namespace');
          t.equal(typeof SmackHooks.getFuncNamespace('math.sums').sub, 'undefined', 'sub function not copied over to the math.sums namespace');
          t.equal(typeof SmackHooks.getFuncNamespace('math').add, 'undefined', 'add function removed from the math namespace');
          t.equal(typeof SmackHooks.getFuncNamespace('math').sub, 'undefined', 'sub function removed from the math namespace');

          var id = get(unit, 'id');
          unit.deleteRecord();
          run(unit, 'save').then(() => {
            t.notOk(store.hasRecordForId('compilation-unit', id), 'record still in store');
            t.equal(typeof SmackHooks.getFuncNamespace('math.sums').add, 'undefined', 'add function removed from the math namespace');
            done();
          });
        });
      });
    });
  });
});

test('execute', function(t) {
  t.expect(4);
  const done = t.async(2);

  SmackHooks.getPackNamespace('')['math'] = { _f : {
    add : function(a, b) { return a + b; },
    error : function() { throw 'deliberate error'; }
  }};

  var addExec = run(store, 'createRecord', 'execute-event', { name : 'math.add', arguments : [1, 1] });
  run(addExec, 'save').then(() => {
    t.equal(get(addExec, 'result'), 2, 'execution result');
    t.ok(get(addExec, 'success'), 'success status');
    done();
  });

  var errExec = run(store, 'createRecord', 'execute-event', { name : 'math.error' });
  run(errExec, 'save').then(() => {
    t.notOk(get(errExec, 'success'), 'success status');
    t.equal(get(errExec, 'errorMessage'), 'deliberate error', 'error message');
    done();
  });
});

test('execute anonymous', function(t) {
  t.expect(4);
  const done = t.async(2);

  SmackHooks.getPackNamespace('')['math'] = { _f : {
    add : function(a, b) { return a + b; },
    error : function() { throw 'deliberate error'; }
  }};

  var addExec = run(store, 'createRecord', 'execute-anonymous-event',
      { source : 'c = a + b;', arguments : { a : 1, b : 1, c : 0 }});
  run(addExec, 'save').then(() => {
    t.deepEqual(get(addExec, 'result'), { a : 1, b : 1, c : 2 }, 'execution result');
    t.ok(get(addExec, 'success'), 'success status');
    done();
  });

  var errExec = run(store, 'createRecord', 'execute-anonymous-event',
      { source : 'math.error();' });
  run(errExec, 'save').then(() => {
    t.notOk(get(errExec, 'success'), 'success status');
    t.equal(get(errExec, 'errorMessage'), 'deliberate error', 'error message');
    done();
  });
});
