'use strict';

var resolveRefs = require('json-refs').resolveRefsAt;
var YAML = require('js-yaml');

function yamlRefs(filepath) {
  var options = {
    loaderOptions: {
      processContent: function processContent(content, callback) {
        callback(undefined, YAML.load(content.text));
      }
    }
  };

  return new Promise(function (resolve) {
    resolveRefs(filepath, options).then(function (results) {
      resolve(results.resolved);
    }, function (err) {
      console.log(err);
    });
  });
}

module.exports = yamlRefs;
