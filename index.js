var _ = require('underscore');
var Backbone = require('backbone');

// A model subclass that uses our sync.
var Model = Backbone.Model.extend({
    // Use the collection database by default. Override this and set it to a
    // function or instance of a database to use another.
    database: function() {
        if (this.collection) {
            return _.result(this.collection, 'database');
        }
    },

    // Use `_id` as the identifier, to match CouchDB.
    idAttribute: '_id',

    // Whether it's okay if the record is missing.
    allowMissing: true,

    // Override sync with ours.
    sync: function(method, model, options) {
        var db = _.result(model, 'database');

        var success = options.success || function() {};
        var error = options.error || function() {};

        switch (method) {
        case 'read':
            db.get(model.id, function(err, doc) {
                if (!err) {
                    return success(doc);
                }
                if (err.error === 'not_found' && model.allowMissing) {
                    return success({});
                }
                error(err);
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
    // Override this and set it to a function or instance of a database.
    database: null,

    // The call to read all the documents. You usually want to override this
    // with a call to `db.view()` instead.
    read: function(db, callback) {
        db.list({ include_docs: true }, callback);
    },

    // Provide a default `parse` override that extracts documents.
    parse: function(res) {
        return _.pluck(res.rows, 'doc');
    },

    // Override sync with ours.
    sync: function(method, model, options) {
        var db = _.result(model, 'database');

        var success = options.success || function() {};
        var error = options.error || function() {};

        switch (method) {
        case 'read':
            model.read(db, function(err, res) {
                err ? error(err) : success(res);
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
