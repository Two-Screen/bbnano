Backbone Cradle
---------------

Extension for [Backbone.js] to sync with [CouchDB] using [nano] on [Node.js].

 [Backbone.js]: http://documentcloud.github.com/backbone/
 [CouchDB]: http://couchdb.apache.org/
 [nano]: https://github.com/dscape/nano
 [Node.js]: http://nodejs.org/

### Installation

    npm install bbnano

### Usage

    var nano = require('nano')('http://localhost:5984/foo');
    var bbnano = require('bbnano')(nano);

    var doc = new bbnano.Model({
        message: 'Hello world!'
    });
    doc.save();
