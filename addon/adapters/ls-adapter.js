// TODO :
// - add hooks for incoming and outgoing records of specific types.
// - create package for ember models, complete with pluggable triggers fired off the hooks

import Ember from 'ember';
import DS from 'ember-data';
import Where from 'npm:where-clause-evaluate';
import SmackHooks from 'smack-ember-adapters/adapters/smackHooks';
import storageForm from 'smack-ember-adapters/adapters/storageForm';
var fromStorageForm = storageForm.fromStorageForm;
var toStorageForm = storageForm.toStorageForm;

const DEFAULT_NAMESPACE = 'DS.LSAdapter';

const LSAdapter = DS.Adapter.extend(Ember.Evented, {
  /**
   * This governs if promises will be resolved immeadiatly for `findAll`
   * requests or if they will wait for the store requests to finish. This matches
   * the ember < 2.0 behavior.
   * [deprecation id: ds.adapter.should-reload-all-default-behavior]
   */
  shouldReloadAll: function(/* modelClass, snapshotArray */) {
    return true;
  },

  /**
   * Conforms to ember <2.0 behavior, in order to remove deprecation.
   * Probably safe to remove if running on ember 2.0
   * [deprecation id: ds.model.relationship-changing-to-asynchrounous-by-default]
   */
  shouldBackgroundReloadRecord: function(){
    return false;
  },

  /**
    This is the main entry point into finding records. The first parameter to
    this method is the model's name as a string.

    @method find
    @param {DS.Model} type
    @param {Object|String|Integer|null} id
    */
  findRecord: function(store, type, id, opts) {
    var allowRecursive = true;
    var namespace = this._namespaceForType(type, this.loadData());
    var record;
    try {
      record = Ember.A(fromStorageForm(store, type, namespace.records[id], this.loadData()));
    } catch(e) { return Ember.RSVP.reject(new Error(e)); }

    /**
     * In the case where there are relationships, this method is called again
     * for each relation. Given the relations have references to the main
     * object, we use allowRecursive to avoid going further into infinite
     * recursiveness.
     *
     * Concept from ember-indexdb-adapter
     */
    if (opts && typeof opts.allowRecursive !== 'undefined') {
      allowRecursive = opts.allowRecursive;
    }
    if (!record || !record.hasOwnProperty('id')) {
      return Ember.RSVP.reject(new Error("Couldn't find record of" + " type '" + type.modelName + "' for the id '" + id + "'."));
    }

    try {
      SmackHooks.onFind(this.loadData(), type, record, allowRecursive);
    } catch(e) {
      return Ember.RSVP.reject(new Error("On find hook failed on: " + " type '" + type.modelName + "' for the id '" + id + "'.\n\n" + e));
    }

    var res;
    if (allowRecursive) {
      res = this.loadRelationships(store, type, record);
    } else {
      res = Ember.RSVP.resolve(record);
    }
    return res;
  },

  findMany: function (store, type, ids, opts) {
    var namespace = this._namespaceForType(type, this.loadData());
    var allowRecursive = true,
      results = Ember.A([]), record;

    /**
     * In the case where there are relationships, this method is called again
     * for each relation. Given the relations have references to the main
     * object, we use allowRecursive to avoid going further into infinite
     * recursiveness.
     *
     * Concept from ember-indexdb-adapter
     */
    if (opts && typeof opts.allowRecursive !== 'undefined') {
      allowRecursive = opts.allowRecursive;
    }

    var hash = this.loadData();

    for (var i = 0; i < ids.length; i++) {
      try {
        record = fromStorageForm(store, type, namespace.records[ids[i]], hash);
      } catch(e) { return Ember.RSVP.reject(new Error(e)); }

      if (!record || !record.hasOwnProperty('id')) {
        return Ember.RSVP.reject(new Error("Couldn't find record of type '" + type.modelName + "' for the id '" + ids[i] + "'."));
      }
      try {
        SmackHooks.onFind(hash, type, res, record);
      } catch(e) {
        return Ember.RSVP.reject(new Error("On find hook failed on: " + " type '" + type.modelName + "'.\n\n" + e));
      }
      results.push(Ember.copy(record));
    }

    var res;
    if (results.get('length') && allowRecursive) {
      res = this.loadRelationshipsForMany(store, type, results);
    } else {
      res = Ember.RSVP.resolve(results);
    }
    return res;
  },

  // Supports queries that look like this:
  //
  //   {
  //     <property to query>: <value or regex (for strings) to match>,
  //     ...
  //   }
  //
  // Every property added to the query is an "AND" query, not "OR"
  //
  // Example:
  //
  //  match records with "complete: true" and the name "foo" or "bar"
  //
  //    { complete: true, name: /foo|bar/ }
  query: function (store, type, query /*recordArray*/) {
    var hash = this.loadData();
    var namespace = this._namespaceForType(type, hash);
    var results;
    try {
      var records = {};
      for(var id in namespace.records) {
        records[id] = fromStorageForm(store, type, namespace.records[id], hash);
      }
      results = this._query(records, query);
    } catch(e) {   return Ember.RSVP.reject(new Error(e)); }

    var allowRecursive = results.get('length');

    try {
      SmackHooks.onQuery(hash, type, results, allowRecursive);
    } catch(e) {
      return Ember.RSVP.reject(new Error("On find hook failed on: " + " type '" + type.modelName + "'.\n\n" + e));
    }
    var res;
    if (allowRecursive) {
      res = this.loadRelationshipsForMany(store, type, results);
    } else {
      res = Ember.RSVP.resolve(results);
    }
    return res;
  },

  _evaluate: Where.newEvaluator({ cache : true }),

  _query: function (records, query) {
    var results = Ember.A([]), record;

    for (var id in records) {
      record = records[id];
      if (!query || this._evaluate(record, query)) {
        results.push(Ember.copy(record));
      }
    }
    return results;
  },

  findAll: function (store, type) {
    var namespace = this._namespaceForType(type, this.loadData()),
      results = Ember.A([]);

    try {
      SmackHooks.onFindAll(this.loadData(), type, namespace.records);
    } catch(e) {
      return Ember.RSVP.reject(new Error("On find hook failed on: " + " type '" + type.modelName + "'.\n\n" + e));
    }
    for (var id in namespace.records) {
      results.push(Ember.copy(namespace.records[id]));
    }
    var res = Ember.RSVP.resolve(results);
    return res;
  },

  createRecord: function (store, type, snapshot) {
    var hash = this.loadData();
    var namespaceRecords = this._namespaceForType(type, hash);
    var serializer = store.serializerFor(type.modelName);
    var recordHash = serializer.serialize(snapshot, {includeId: true});

    try {
      SmackHooks.beforeCreate(hash, type, recordHash);
    } catch(e) {
      return Ember.RSVP.reject(new Error("Before create hook failed on: " + " type '" + type.modelName + "' for the id '" + recordHash.id + "'.\n\n" + e));
    }
    try {
      namespaceRecords.records[recordHash.id] = toStorageForm(store, type, recordHash);
    } catch(e) { return Ember.RSVP.reject(new Error(e)); }

    this.persistData(type, namespaceRecords, hash);
    try {
      SmackHooks.afterCreate(hash, type, recordHash);
    } catch(e) {
      return Ember.RSVP.reject(new Error("After create hook failed on: " + " type '" + type.modelName + "' for the id '" + recordHash.id + "'.\n\n" + e));
    }
    return Ember.RSVP.resolve(Ember.A(recordHash));
  },

  updateRecord: function (store, type, snapshot) {
    var hash = this.loadData();
    var namespaceRecords = this._namespaceForType(type, hash);
    var id = snapshot.id;
    var serializer = store.serializerFor(type.modelName);
    var recordHash = serializer.serialize(snapshot, {includeId: true});

    try {
      SmackHooks.beforeUpdate(hash, type, recordHash);
    } catch(e) {
      return Ember.RSVP.reject(new Error("Before update hook failed on: " + " type '" + type.modelName + "' for the id '" + recordHash.id + "'.\n\n" + e));
    }
    try {
      namespaceRecords.records[id] = toStorageForm(store, type, recordHash);
    } catch(e) { return Ember.RSVP.reject(new Error(e)); }

    this.persistData(type, namespaceRecords, hash);
    try {
      SmackHooks.afterUpdate(hash, type, recordHash);
    } catch(e) {
      return Ember.RSVP.reject(new Error("After update hook failed on: " + " type '" + type.modelName + "' for the id '" + recordHash.id + "'.\n\n" + e));
    }
    return Ember.RSVP.resolve(Ember.A(recordHash));
  },

  deleteRecord: function (store, type, snapshot) {
    var hash = this.loadData();
    var namespaceRecords = this._namespaceForType(type, hash);
    var id = snapshot.id;
    var recordHash = namespaceRecords.records[id];

    try {
      SmackHooks.beforeDelete(hash, type, recordHash);
    } catch(e) {
      return Ember.RSVP.reject(new Error("Before delete hook failed on: " + " type '" + type.modelName + "' for the id '" + recordHash.id + "'.\n\n" + e));
    }
    delete namespaceRecords.records[id];
    this.persistData(type, namespaceRecords, hash);
    try {
      SmackHooks.afterDelete(hash, type, recordHash);
    } catch(e) {
      return Ember.RSVP.reject(new Error("After delete hook failed on: " + " type '" + type.modelName + "' for the id '" + recordHash.id + "'.\n\n" + e));
    }
    return Ember.RSVP.resolve();
  },

  generateIdForRecord: function () {
    return Math.random().toString(32).slice(2).substr(0, 5);
  },

  // private

  adapterNamespace: function () {
    return this.get('namespace') || DEFAULT_NAMESPACE;
  },

  loadData: function () {
    var storage = this.getLocalStorage().getItem(this.adapterNamespace());
    return storage ? JSON.parse(storage) : {};
  },

  persistData: function(type, data, hash) {
    var modelNamespace = this.modelNamespace(type);
    // var localStorageData = this.loadData();

    hash[modelNamespace] = data;

    this.getLocalStorage().setItem(this.adapterNamespace(), JSON.stringify(hash/*localStorageData*/));
  },

  getLocalStorage: function() {
    if (this._localStorage) { return this._localStorage; }

    var storage;
    try {
      storage = this.getNativeStorage() || this._enableInMemoryStorage();
    } catch (e) {
      storage = this._enableInMemoryStorage(e);
    }
    this._localStorage = storage;
    return this._localStorage;
  },

  _enableInMemoryStorage: function(reason) {
    this.trigger('persistenceUnavailable', reason);
    return {
      storage: {},
      getItem: function(name) {
        return this.storage[name];
      },
      setItem: function(name, value) {
        this.storage[name] = value;
      }
    };
  },

  // This exists primarily as a testing extension point
  getNativeStorage: function() {
    return localStorage;
  },

  _namespaceForType: function (type, storage) {
    var namespace = this.modelNamespace(type);
    // var storage   = this.loadData();

    return storage[namespace] || {records: {}};
  },

  modelNamespace: function(type) {
    return type.url || type.modelName;
  },


  /**
   * This takes a record, then analyzes the model relationships and replaces
   * ids with the actual values.
   *
   * Stolen from ember-indexdb-adapter
   *
   * Consider the following JSON is entered:
   *
   * ```js
   * {
   *   "id": 1,
   *   "title": "Rails Rambo",
   *   "comments": [1, 2]
   * }
   *
   * This will return:
   *
   * ```js
   * {
   *   "id": 1,
   *   "title": "Rails Rambo",
   *   "comments": [1, 2]
   *
   *   "_embedded": {
   *     "comment": [{
   *       "_id": 1,
   *       "comment_title": "FIRST"
   *     }, {
   *       "_id": 2,
   *       "comment_title": "Rails is unagi"
   *     }]
   *   }
   * }
   *
   * This way, whenever a resource returned, its relationships will be also
   * returned.
   *
   * @method loadRelationships
   * @private
   * @param {DS.Model} type
   * @param {Object} record
   */
  loadRelationships: function(store, type, record) {
    var adapter = this,
      relationshipNames, relationships;

    /**
     * Create a chain of promises, so the relationships are
     * loaded sequentially.  Think of the variable
     * `recordPromise` as of the accumulator in a left fold.
     */
    var recordPromise = Ember.RSVP.resolve(record);

    relationshipNames = Ember.get(type, 'relationshipNames');
    relationships = relationshipNames.belongsTo
    .concat(relationshipNames.hasMany);

    relationships.forEach(function(relationName) {
      var relationModel = type.typeForRelationship(relationName,store);
      var relationEmbeddedId = record[relationName];
      var relationProp  = adapter.relationshipProperties(type, relationName);
      var relationType  = relationProp.kind;

      var opts = {allowRecursive: false};

      /**
       * embeddedIds are ids of relations that are included in the main
       * payload, such as:
       *
       * {
       *    cart: {
       *      id: "s85fb",
       *      customer: "rld9u"
       *    }
       * }
       *
       * In this case, cart belongsTo customer and its id is present in the
       * main payload. We find each of these records and add them to _embedded.
       */
      if (relationEmbeddedId && LSAdapter.prototype.isPrototypeOf(adapter))
        {
          recordPromise = recordPromise.then(function(recordPayload) {
            var promise;
            if (relationType === 'belongsTo' || relationType === 'hasOne') {
              promise = adapter.findRecord(store, relationModel, relationEmbeddedId, opts);
            } else if (relationType === 'hasMany') {
              promise = adapter.findMany(store, relationModel, relationEmbeddedId, opts);
            }

            return promise.then(function(relationRecord) {
              return adapter.addEmbeddedPayload(recordPayload, relationName, relationRecord);
            });
          });
        }
    });

    return recordPromise;
  },


  /**
   * Given the following payload,
   *
   *   {
   *      cart: {
   *        id: "1",
   *        customer: "2"
   *      }
   *   }
   *
   * With `relationshipName` being `customer` and `relationshipRecord`
   *
   *   {id: "2", name: "Rambo"}
   *
   * This method returns the following payload:
   *
   *   {
   *      cart: {
   *        id: "1",
   *        customer: "2"
   *      },
   *      _embedded: {
   *        customer: {
   *          id: "2",
   *          name: "Rambo"
   *        }
   *      }
   *   }
   *
   * which is then treated by the serializer later.
   *
   * @method addEmbeddedPayload
   * @private
   * @param {Object} payload
   * @param {String} relationshipName
   * @param {Object} relationshipRecord
   */
  addEmbeddedPayload: function(payload, relationshipName, relationshipRecord) {
    var objectHasId = (relationshipRecord && relationshipRecord.id);
    var arrayHasIds = (relationshipRecord.length && relationshipRecord.isEvery("id"));
    var isValidRelationship = (objectHasId || arrayHasIds);

    if (isValidRelationship) {
      if (!payload._embedded) {
        payload._embedded = {};
      }

      payload._embedded[relationshipName] = relationshipRecord;
      if (relationshipRecord.length) {
        payload[relationshipName] = relationshipRecord.mapBy('id');
      } else {
        payload[relationshipName] = relationshipRecord.id;
      }
    }

    if (this.isArray(payload[relationshipName])) {
      payload[relationshipName] = payload[relationshipName].filter(function(id) {
        return id;
      });
    }

    return payload;
  },


  isArray: function(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  },

  /**
   * Same as `loadRelationships`, but for an array of records.
   *
   * @method loadRelationshipsForMany
   * @private
   * @param {DS.Model} type
   * @param {Object} recordsArray
   */
  loadRelationshipsForMany: function(store, type, recordsArray) {
    var adapter = this,
      promise = Ember.RSVP.resolve(Ember.A([]));

    /**
     * Create a chain of promises, so the records are loaded sequentially.
     * Think of the variable promise as of the accumulator in a left fold.
     */
    recordsArray.forEach(function(record) {
      promise = promise.then(function(records) {
        return adapter.loadRelationships(store, type, record)
        .then(function(loadedRecord) {
          records.push(loadedRecord);
          return records;
        });
      });
    });

    return promise;
  },


  /**
   *
   * @method relationshipProperties
   * @private
   * @param {DS.Model} type
   * @param {String} relationName
   */
  relationshipProperties: function(type, relationName) {
    var relationships = Ember.get(type, 'relationshipsByName');
    if (relationName) {
      return relationships.get(relationName);
    } else {
      return relationships;
    }
  }
});

export default LSAdapter;
