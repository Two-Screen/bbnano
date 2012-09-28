var assert = require('assert');
var util   = require('util');
var test   = require('tap').test;

// This matches the Travis CI setup. If testing locally, first run:
//     curl -X PUT http://localhost:5984/bbnano_test
var nano = require('nano')('http://localhost:5984/bbnano_test');
var bbnano = require('./')(nano)

// Helper for sync() options.
var callbackOpts = function(t, message, callback) {
    return {
        success: function() {
            t.pass(message);
            callback();
        },
        error: function(err) {
            t.error(err, message);
            callback();
        }
    };
};

test('basic usage', function(t) {
    t.plan(15);

    var collection = new bbnano.Collection();
    var model = new bbnano.Model();
    fetchBeforeInsert();

    function fetchBeforeInsert() {
        collection.fetch(callbackOpts(t, 'fetch before insert', function() {
            t.is(collection.length, 0, 'collection must be empty');
            insert();
        }));
    }

    function insert() {
        var res = model.save({ test: 'foo' }, callbackOpts(t, 'insert', fin));
        if (res === false) {
            t.fail('insert');
            fin();
        }

        function fin() {
            t.ok(model.has('_id'), 'must have an ID after insert');
            t.ok(model.has('_rev'), 'must have a rev after insert');
            t.is(model.id, model.get('_id'), 'idAttribute is _id');
            fetchAfterInsert();
        }
    }

    function fetchAfterInsert() {
        collection.fetch(callbackOpts(t, 'fetch after insert', function() {
            t.is(collection.length, 1, 'collection must have one model');
            t.is(collection.at(0).get('test'), 'foo', 'attribute must match');
            update();
        }));
    }

    function update() {
        var id = model.id;
        var rev = model.get('_rev');
        var res = model.save({ test: 'foo' }, callbackOpts(t, 'update', fin));
        if (res === false) {
            t.fail('update');
            fin();
        }

        function fin() {
            t.is(model.id, id, 'ID must not change after update');
            t.isNot(model.get('_rev'), rev, 'rev must change after update');
            destroy();
        }
    }

    function destroy() {
        var res = model.destroy(callbackOpts(t, 'destroy', fin));
        if (res === false) {
            t.fail('destroy');
            fin();
        }

        function fin() {
            fetchAfterDestroy();
        }
    }

    function fetchAfterDestroy() {
        collection.fetch(callbackOpts(t, 'fetch after destroy', function() {
            t.is(collection.length, 0, 'collection must be empty');
        }));
    }
});
