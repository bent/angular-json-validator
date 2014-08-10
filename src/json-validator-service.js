angular.module("jsonValidator").factory("jsonValidator", function (
  $q, $injector, $window, jsonSchemaCache
) {
  // Because TV4 can only report _all_ missing URIs (rather than just those missing for a
  // particular schema) we keep track of schema promises to make sure we don't try and load
  // the same schema more than once.
  var schemaPromises = {};

  function createSchemaPromise(uri) {
    var schema = jsonSchemaCache.get(uri);

    // If the schema has _not_ been pre-loaded into the schema cache
    if (angular.isUndefined(schema)) {
      // Then load it using HTTP
      // Use injector to avoid circular dependencies given that this is an HttpInterceptor
      return $injector.get('$http').get(uri).then(function(response) {
        // Note that we DON'T put it in the JSON schema cache - we're doing our own caching
        return response.data;
      });
    } else {
      // Otherwise just wrap it in a promise and return it
      return $q.when(schema);
    }
  }

  function loadSchema(uri) {
    // If we've already kicked-off a load for the schema in the past, then return it. Otherwise,
    // kick off a load.
    var schemaPromise = schemaPromises[uri];

    if(!schemaPromise) {
      schemaPromise = createSchemaPromise(uri);
      schemaPromises[uri] = schemaPromise;
    }

    return schemaPromise;
  }

  function addSchema(uri) {
    return loadSchema(uri).then(function(schema) {
      tv4.addSchema(uri, schema);

      var missingUris = tv4.getMissingUris();
      // If schemas are missing
      if (missingUris.length) {
        // Load and register them.
        var refSchemaPromises = [];

        angular.forEach(missingUris, function(missingUri) {
          // Note that this is a recursive operation.
          refSchemaPromises.push(addSchema(missingUri));
        });
        // Only resolve when all of the missing schemas have been added. Ideally we'd only be
        // waiting on schemas that the added schema depends on, but there's no way to know.
        return $q.all(refSchemaPromises).then(function() {
          return schema;
        });
      }

      return $q.when(schema);
    });
  }

  function getSchema(uri) {
    var schema = tv4.getSchema(uri);
    return schema ? $q.when(schema) : addSchema(uri);
  }

  return {
    validateJson: function(object, schemaUri) {
      return getSchema(schemaUri).then(function(schema) {
        if (tv4.validate(object, schema)) {
          return object;
        } else {
          return $q.reject(tv4.error);
        }
      });
    }
  };
});