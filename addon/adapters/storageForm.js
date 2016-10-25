import Ember from 'ember';
// import adapter from 'smack-ember-adapters/adapters/ls-adapter';

var form = {
  toStorageForm(store, type, record) {
    if(!record) {
      return record;
    }
    var storeForm = Ember.copy(record);
    type.eachRelationship((name, desc) => {
      if(desc.kind !== 'hasMany') {
        return;
      }
      var inverseDesc = type.inverseFor(name, store);
      if(inverseDesc && inverseDesc.name && inverseDesc.name !== '' && inverseDesc.kind !== 'hasMany') {
        storeForm[name] = inverseDesc.name;
        // throw 'no belongsTo/hasOne inverse is defined in the model: ' + desc.type +
        //   ' for the has many relationship: ' + name + ' in the model: ' + type.modelName;
      }

    }, this);
    return storeForm;
  },

  fromStorageForm(store, type, storeForm, hash) {
    if(!storeForm || !hash[type.modelName] || !hash[type.modelName].records) {
      return storeForm;
    }
    var record = Ember.copy(storeForm);
    type.eachRelationship((name, desc) => {
      if(desc.kind !== 'hasMany') {
        return;
      }
      var inverseDesc = type.inverseFor(name, store);
      var ids = [];
      if(hash[desc.type] && hash[desc.type].records) {
        for(var id in hash[desc.type].records) {
          if(hash[desc.type].records[id][inverseDesc.name] === record.id)
            { ids.push(id); }
        }
      }
      record[name] = ids;
    }, this);
    return record;
  }
};

export default form;
