var express = require('express');
var bodyParser = require('body-parser');
var elasticsearch = require('elasticsearch');
var couchbase = require('couchbase');
var qs = require('querystring');
var _ = require('underscore');
var client = new elasticsearch.Client({
    host: "127.0.0.1:9200"
});
var app = express();

app.use(bodyParser());
var port = process.env.PORT || 8080;
var router = express.Router();

var query;
var terms;
var objects;
var attributes;
var body;
var ids = [];

app.use('/search', router);

router.get('/', function(req, res) {
  res.json({ message: 'OPENi Search API Running!'});
});

router.get('/ids', function(req, res) {
  query = req._parsedUrl.query;
  terms = qs.parse(query);

  objects = terms.objects;
  attributes = _.omit(terms, 'objects');

  if(_.isEmpty(attributes)) {
    objQuery();
  } else if(_.isUndefined(objects)) {
    attrQuery();
  } else {
    objAttrQuery();
  }

  function objQuery() {
    objects = objects.split(',');

    for(var prop in objects) {
      objects[prop] = {
        exists: {
          field: objects[prop]
        }
      };
    }

    formBody(objects);
  }

  function attrQuery() {
    var keys = _.keys(attributes);
    var values = _.values(attributes);
    var attrs = [];
    for(var i = 0; i < keys.length; i++) {
      var term = {};
      var dummy = {};
      var dummy2 = {};
      var age = {};

      if(_.contains(values[i], ':')) {
        var range = values[i].split(':');
        var from = range[0];
        var to = range[1];
        age.from = from;
        age.to = to;
        dummy.age  = age;
        dummy2.range = dummy;
        attrs[i] = dummy2;

      } else {
        term[keys[i]] = values[i];
        dummy.term = term;
        attrs[i] = dummy;
      }
    }
    formBody(attrs);
  }

  function objAttrQuery() {
    var keys = _.keys(attributes);
    var values = _.values(attributes);
    var attrs = [];
    objects = objects.split(',');

    for(var prop in objects) {
      objects[prop] = {
        exists: {
          field: objects[prop]
        }
      };
    }


    for(var i = 0; i < keys.length; i++) {
      var term = {};
      var dummy = {};
      var dummy2 = {};
      var age = {};

      if(_.contains(values[i], ':')) {
        var range = values[i].split(':');
        var from = range[0];
        var to = range[1];
        age.from = from;
        age.to = to;
        dummy.age  = age;
        dummy2.range = dummy;
        attrs[i] = dummy2;

      } else {
        term[keys[i]] = values[i];
        dummy.term = term;
        attrs[i] = dummy;
      }
    }
    formBody(objects, attrs);
  }


  function formBody(obj, attr) {
    var query;
    if(arguments.length === 1) {
      query = obj;
    } else if(arguments.length === 2) {
      query = [obj, attr];
    }
    body = {
      filter: {
        bool: {
          must: query
        }
      }
    };
  }

  client.search({
      index: 'openi',
      body: body
    }, function (error, response) {
        if (error) {
          console.log(error);
        } else {
          for(var i = 0; i < response.hits.total; i++) {
            ids[i] = response.hits.hits[i]._id;
          }
          res.json({ ids: ids});
          ids = [];
        }
    });

});


app.listen(port);
console.log('Magic happens on port ' + port);