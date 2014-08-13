angular.module("bt.jsonValidator", []);
angular.module("bt.jsonValidator").factory("jsonSchemaCache", ["$cacheFactory", function ($cacheFactory) {
  return $cacheFactory('jsonSchema');
}]);
angular.module("bt.jsonValidator").factory("jsonValidatorHttpInterceptor", ["$q", "jsonValidator", "$window", function (
  $q, jsonValidator, $window
) {
  return {
    request: function(config) {
      var schemaUrl = config.jsonSchemaUrl;

      if (schemaUrl) {
        var uri = schemaUrl.request;

        if (uri) {
          return jsonValidator.validateJson(config.data, uri).then(function() {
            return config;
          }, function(error) {
            $window.console.error(error);
            return $q.reject(config);
          });
        }
      }

      return config;
    },
    response: function(response) {
      var schemaUrl = response.config.jsonSchemaUrl;

      if (schemaUrl) {
        var uri = schemaUrl.response;

        if (uri) {
          return jsonValidator.validateJson(response.data, uri).then(function() {
            return response;
          }, function(error) {
            $window.console.error(error);
            return $q.reject(response);
          });
        }
      }

      return response;
    }
  }
}]);
angular.module("bt.jsonValidator").factory("jsonValidator", ["$q", "$injector", "$window", "jsonSchemaCache", function (
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
}]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzb24tdmFsaWRhdG9yLmpzIiwianNvbi12YWxpZGF0b3ItY2FjaGUtc2VydmljZS5qcyIsImpzb24tdmFsaWRhdG9yLWh0dHAtaW50ZXJjZXB0b3Itc2VydmljZS5qcyIsImpzb24tdmFsaWRhdG9yLXNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSw4REFBOEQsa0JBQUE7RUFDNUQ7QUFDRixDQUFDLENBQUE7QUNGRCwyRUFBMkUsbUNBQUE7RUFDekU7QUFDRjtFQUNFO0lBQ0U7TUFDRTs7TUFFQTtRQUNFOztRQUVBO1VBQ0U7WUFDRTtVQUNGO1lBQ0U7WUFDQTtVQUNGO1FBQ0Y7TUFDRjs7TUFFQTtJQUNGO0lBQ0E7TUFDRTs7TUFFQTtRQUNFOztRQUVBO1VBQ0U7WUFDRTtVQUNGO1lBQ0U7WUFDQTtVQUNGO1FBQ0Y7TUFDRjs7TUFFQTtJQUNGO0VBQ0Y7QUFDRixDQUFDLENBQUE7QUN6Q0QsNERBQTRELGtEQUFBO0VBQzFEO0FBQ0Y7RUFDRTtFQUNBO0VBQ0E7RUFDQTs7RUFFQTtJQUNFOztJQUVBO0lBQ0E7TUFDRTtNQUNBO01BQ0E7UUFDRTtRQUNBO01BQ0Y7SUFDRjtNQUNFO01BQ0E7SUFDRjtFQUNGOztFQUVBO0lBQ0U7SUFDQTtJQUNBOztJQUVBO01BQ0U7TUFDQTtJQUNGOztJQUVBO0VBQ0Y7O0VBRUE7SUFDRTtNQUNFOztNQUVBO01BQ0E7TUFDQTtRQUNFO1FBQ0E7O1FBRUE7VUFDRTtVQUNBO1FBQ0Y7UUFDQTtRQUNBO1FBQ0E7VUFDRTtRQUNGO01BQ0Y7O01BRUE7SUFDRjtFQUNGOztFQUVBO0lBQ0U7SUFDQTtFQUNGOztFQUVBO0lBQ0U7TUFDRTtRQUNFO1VBQ0U7UUFDRjtVQUNFO1FBQ0Y7TUFDRjtJQUNGO0VBQ0Y7QUFDRixDQUFDLENBQUEiLCJmaWxlIjoianNvbi12YWxpZGF0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJhbmd1bGFyLm1vZHVsZShcImJ0Lmpzb25WYWxpZGF0b3JcIiwgW10pOyIsImFuZ3VsYXIubW9kdWxlKFwiYnQuanNvblZhbGlkYXRvclwiKS5mYWN0b3J5KFwianNvblNjaGVtYUNhY2hlXCIsIGZ1bmN0aW9uICgkY2FjaGVGYWN0b3J5KSB7XG4gIHJldHVybiAkY2FjaGVGYWN0b3J5KCdqc29uU2NoZW1hJyk7XG59KTsiLCJhbmd1bGFyLm1vZHVsZShcImJ0Lmpzb25WYWxpZGF0b3JcIikuZmFjdG9yeShcImpzb25WYWxpZGF0b3JIdHRwSW50ZXJjZXB0b3JcIiwgZnVuY3Rpb24gKFxuICAkcSwganNvblZhbGlkYXRvciwgJHdpbmRvd1xuKSB7XG4gIHJldHVybiB7XG4gICAgcmVxdWVzdDogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICB2YXIgc2NoZW1hVXJsID0gY29uZmlnLmpzb25TY2hlbWFVcmw7XG5cbiAgICAgIGlmIChzY2hlbWFVcmwpIHtcbiAgICAgICAgdmFyIHVyaSA9IHNjaGVtYVVybC5yZXF1ZXN0O1xuXG4gICAgICAgIGlmICh1cmkpIHtcbiAgICAgICAgICByZXR1cm4ganNvblZhbGlkYXRvci52YWxpZGF0ZUpzb24oY29uZmlnLmRhdGEsIHVyaSkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICR3aW5kb3cuY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KGNvbmZpZyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICB9LFxuICAgIHJlc3BvbnNlOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgdmFyIHNjaGVtYVVybCA9IHJlc3BvbnNlLmNvbmZpZy5qc29uU2NoZW1hVXJsO1xuXG4gICAgICBpZiAoc2NoZW1hVXJsKSB7XG4gICAgICAgIHZhciB1cmkgPSBzY2hlbWFVcmwucmVzcG9uc2U7XG5cbiAgICAgICAgaWYgKHVyaSkge1xuICAgICAgICAgIHJldHVybiBqc29uVmFsaWRhdG9yLnZhbGlkYXRlSnNvbihyZXNwb25zZS5kYXRhLCB1cmkpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICR3aW5kb3cuY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfVxuICB9XG59KTsiLCJhbmd1bGFyLm1vZHVsZShcImJ0Lmpzb25WYWxpZGF0b3JcIikuZmFjdG9yeShcImpzb25WYWxpZGF0b3JcIiwgZnVuY3Rpb24gKFxuICAkcSwgJGluamVjdG9yLCAkd2luZG93LCBqc29uU2NoZW1hQ2FjaGVcbikge1xuICAvLyBCZWNhdXNlIFRWNCBjYW4gb25seSByZXBvcnQgX2FsbF8gbWlzc2luZyBVUklzIChyYXRoZXIgdGhhbiBqdXN0IHRob3NlIG1pc3NpbmcgZm9yIGFcbiAgLy8gcGFydGljdWxhciBzY2hlbWEpIHdlIGtlZXAgdHJhY2sgb2Ygc2NoZW1hIHByb21pc2VzIHRvIG1ha2Ugc3VyZSB3ZSBkb24ndCB0cnkgYW5kIGxvYWRcbiAgLy8gdGhlIHNhbWUgc2NoZW1hIG1vcmUgdGhhbiBvbmNlLlxuICB2YXIgc2NoZW1hUHJvbWlzZXMgPSB7fTtcblxuICBmdW5jdGlvbiBjcmVhdGVTY2hlbWFQcm9taXNlKHVyaSkge1xuICAgIHZhciBzY2hlbWEgPSBqc29uU2NoZW1hQ2FjaGUuZ2V0KHVyaSk7XG5cbiAgICAvLyBJZiB0aGUgc2NoZW1hIGhhcyBfbm90XyBiZWVuIHByZS1sb2FkZWQgaW50byB0aGUgc2NoZW1hIGNhY2hlXG4gICAgaWYgKGFuZ3VsYXIuaXNVbmRlZmluZWQoc2NoZW1hKSkge1xuICAgICAgLy8gVGhlbiBsb2FkIGl0IHVzaW5nIEhUVFBcbiAgICAgIC8vIFVzZSBpbmplY3RvciB0byBhdm9pZCBjaXJjdWxhciBkZXBlbmRlbmNpZXMgZ2l2ZW4gdGhhdCB0aGlzIGlzIGFuIEh0dHBJbnRlcmNlcHRvclxuICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJyRodHRwJykuZ2V0KHVyaSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAvLyBOb3RlIHRoYXQgd2UgRE9OJ1QgcHV0IGl0IGluIHRoZSBKU09OIHNjaGVtYSBjYWNoZSAtIHdlJ3JlIGRvaW5nIG91ciBvd24gY2FjaGluZ1xuICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UganVzdCB3cmFwIGl0IGluIGEgcHJvbWlzZSBhbmQgcmV0dXJuIGl0XG4gICAgICByZXR1cm4gJHEud2hlbihzY2hlbWEpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWRTY2hlbWEodXJpKSB7XG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBraWNrZWQtb2ZmIGEgbG9hZCBmb3IgdGhlIHNjaGVtYSBpbiB0aGUgcGFzdCwgdGhlbiByZXR1cm4gaXQuIE90aGVyd2lzZSxcbiAgICAvLyBraWNrIG9mZiBhIGxvYWQuXG4gICAgdmFyIHNjaGVtYVByb21pc2UgPSBzY2hlbWFQcm9taXNlc1t1cmldO1xuXG4gICAgaWYoIXNjaGVtYVByb21pc2UpIHtcbiAgICAgIHNjaGVtYVByb21pc2UgPSBjcmVhdGVTY2hlbWFQcm9taXNlKHVyaSk7XG4gICAgICBzY2hlbWFQcm9taXNlc1t1cmldID0gc2NoZW1hUHJvbWlzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2NoZW1hUHJvbWlzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFNjaGVtYSh1cmkpIHtcbiAgICByZXR1cm4gbG9hZFNjaGVtYSh1cmkpLnRoZW4oZnVuY3Rpb24oc2NoZW1hKSB7XG4gICAgICB0djQuYWRkU2NoZW1hKHVyaSwgc2NoZW1hKTtcblxuICAgICAgdmFyIG1pc3NpbmdVcmlzID0gdHY0LmdldE1pc3NpbmdVcmlzKCk7XG4gICAgICAvLyBJZiBzY2hlbWFzIGFyZSBtaXNzaW5nXG4gICAgICBpZiAobWlzc2luZ1VyaXMubGVuZ3RoKSB7XG4gICAgICAgIC8vIExvYWQgYW5kIHJlZ2lzdGVyIHRoZW0uXG4gICAgICAgIHZhciByZWZTY2hlbWFQcm9taXNlcyA9IFtdO1xuXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChtaXNzaW5nVXJpcywgZnVuY3Rpb24obWlzc2luZ1VyaSkge1xuICAgICAgICAgIC8vIE5vdGUgdGhhdCB0aGlzIGlzIGEgcmVjdXJzaXZlIG9wZXJhdGlvbi5cbiAgICAgICAgICByZWZTY2hlbWFQcm9taXNlcy5wdXNoKGFkZFNjaGVtYShtaXNzaW5nVXJpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBPbmx5IHJlc29sdmUgd2hlbiBhbGwgb2YgdGhlIG1pc3Npbmcgc2NoZW1hcyBoYXZlIGJlZW4gYWRkZWQuIElkZWFsbHkgd2UnZCBvbmx5IGJlXG4gICAgICAgIC8vIHdhaXRpbmcgb24gc2NoZW1hcyB0aGF0IHRoZSBhZGRlZCBzY2hlbWEgZGVwZW5kcyBvbiwgYnV0IHRoZXJlJ3Mgbm8gd2F5IHRvIGtub3cuXG4gICAgICAgIHJldHVybiAkcS5hbGwocmVmU2NoZW1hUHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHNjaGVtYTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAkcS53aGVuKHNjaGVtYSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRTY2hlbWEodXJpKSB7XG4gICAgdmFyIHNjaGVtYSA9IHR2NC5nZXRTY2hlbWEodXJpKTtcbiAgICByZXR1cm4gc2NoZW1hID8gJHEud2hlbihzY2hlbWEpIDogYWRkU2NoZW1hKHVyaSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHZhbGlkYXRlSnNvbjogZnVuY3Rpb24ob2JqZWN0LCBzY2hlbWFVcmkpIHtcbiAgICAgIHJldHVybiBnZXRTY2hlbWEoc2NoZW1hVXJpKS50aGVuKGZ1bmN0aW9uKHNjaGVtYSkge1xuICAgICAgICBpZiAodHY0LnZhbGlkYXRlKG9iamVjdCwgc2NoZW1hKSkge1xuICAgICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh0djQuZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=