var Backbone = require('backbone');

// Helper that gets the database from a model.
var getDatabase = function(obj) {
    if (typeof(obj.database) === 'function')
        return obj.database();
    else
        return obj.database;
};

// A model subclass that uses our sync.
var Model = Backbone.Model.extend({
    // Override this and set to a function or instance of a database.
    database: null,

    // Use `_id` as the identifier, to match CouchDB.
    idAttribute: '_id',

    // Override sync with ours.
    sync: function(method, model, options) {
        var db = getDatabase(model);

        var success = options.success || function() {};
        var error = options.error || function() {};

        switch (method) {
        case 'read':
            db.get(model.id, function(err, doc) {
                err ? error(err) : success(doc);
            });
            break;

        case 'create':
        case 'update':
            db.insert(model.toJSON(), function(err, res) {
                err ? error(err) : success({ _id: res.id, _rev: res.rev });
            });
            break;

        case 'delete':
            db.destroy(model.id, model.get('_rev'), function(err, res) {
                err ? error(err) : success({ _id: res.id, _rev: res.rev });
            });
            break;
        }
    }
});

// A collection subclass that uses our sync.
var Collection = Backbone.Collection.extend({
    // Override this and set to a function or instance of a database.
    database: null,

    // The call to read all the documents. You usually want to override this
    // with a call to `db.view()` instead.
    read: function(db, callback) {
        db.list(callback);
    },

    // Override sync with ours.
    sync: function(method, model, options) {
        var db = getDatabase(model);

        var success = options.success || function() {};
        var error = options.error || function() {};

        switch (method) {
        case 'read':
            model.read(db, function(err, docs) {
                err ? error(err) : success(docs);
            });
            break;
        }
    }
});

// Create a scope for the given database.
var bbnano = module.exports = function(db) {
    return {
        Model: Model.extend({ database: db }),
        Collection: Collection.extend({ database: db })
    };
};

// Export the subclasses.
bbnano.Model = Model;
bbnano.Collection = Collection;
