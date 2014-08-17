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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzb24tdmFsaWRhdG9yLmpzIiwianNvbi12YWxpZGF0b3ItY2FjaGUtc2VydmljZS5qcyIsImpzb24tdmFsaWRhdG9yLWh0dHAtaW50ZXJjZXB0b3Itc2VydmljZS5qcyIsImpzb24tdmFsaWRhdG9yLXNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSw4REFBOEQsa0JBQUE7RUFDNUQ7QUFDRixDQUFDLENBQUE7QUNGRCwyRUFBMkUsbUNBQUE7RUFDekU7QUFDRjtFQUNFO0lBQ0U7TUFDRTs7TUFFQTtRQUNFOztRQUVBO1VBQ0U7WUFDRTtVQUNGO1lBQ0U7WUFDQTtVQUNGO1FBQ0Y7TUFDRjs7TUFFQTtJQUNGO0lBQ0E7TUFDRTs7TUFFQTtRQUNFOztRQUVBO1VBQ0U7WUFDRTtVQUNGO1lBQ0U7WUFDQTtVQUNGO1FBQ0Y7TUFDRjs7TUFFQTtJQUNGO0VBQ0Y7QUFDRixDQUFDLENBQUE7QUN6Q0QsNERBQTRELGtEQUFBO0VBQzFEO0FBQ0Y7RUFDRTtFQUNBO0VBQ0E7RUFDQTs7RUFFQTtJQUNFOztJQUVBO0lBQ0E7TUFDRTtNQUNBO01BQ0E7UUFDRTtRQUNBO01BQ0Y7SUFDRjtNQUNFO01BQ0E7SUFDRjtFQUNGOztFQUVBO0lBQ0U7SUFDQTtJQUNBOztJQUVBO01BQ0U7TUFDQTtJQUNGOztJQUVBO0VBQ0Y7O0VBRUE7SUFDRTtNQUNFOztNQUVBO01BQ0E7TUFDQTtRQUNFO1FBQ0E7O1FBRUE7VUFDRTtVQUNBO1FBQ0Y7UUFDQTtRQUNBO1FBQ0E7VUFDRTtRQUNGO01BQ0Y7O01BRUE7SUFDRjtFQUNGOztFQUVBO0lBQ0U7SUFDQTtFQUNGOztFQUVBO0lBQ0U7TUFDRTtRQUNFO1VBQ0U7UUFDRjtVQUNFO1FBQ0Y7TUFDRjtJQUNGO0VBQ0Y7QUFDRixDQUFDLENBQUEiLCJmaWxlIjoiYW5ndWxhci1qc29uLXZhbGlkYXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKFwiYnQuanNvblZhbGlkYXRvclwiLCBbXSk7IiwiYW5ndWxhci5tb2R1bGUoXCJidC5qc29uVmFsaWRhdG9yXCIpLmZhY3RvcnkoXCJqc29uU2NoZW1hQ2FjaGVcIiwgZnVuY3Rpb24gKCRjYWNoZUZhY3RvcnkpIHtcbiAgcmV0dXJuICRjYWNoZUZhY3RvcnkoJ2pzb25TY2hlbWEnKTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKFwiYnQuanNvblZhbGlkYXRvclwiKS5mYWN0b3J5KFwianNvblZhbGlkYXRvckh0dHBJbnRlcmNlcHRvclwiLCBmdW5jdGlvbiAoXG4gICRxLCBqc29uVmFsaWRhdG9yLCAkd2luZG93XG4pIHtcbiAgcmV0dXJuIHtcbiAgICByZXF1ZXN0OiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgIHZhciBzY2hlbWFVcmwgPSBjb25maWcuanNvblNjaGVtYVVybDtcblxuICAgICAgaWYgKHNjaGVtYVVybCkge1xuICAgICAgICB2YXIgdXJpID0gc2NoZW1hVXJsLnJlcXVlc3Q7XG5cbiAgICAgICAgaWYgKHVyaSkge1xuICAgICAgICAgIHJldHVybiBqc29uVmFsaWRhdG9yLnZhbGlkYXRlSnNvbihjb25maWcuZGF0YSwgdXJpKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgICAgICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgJHdpbmRvdy5jb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoY29uZmlnKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gY29uZmlnO1xuICAgIH0sXG4gICAgcmVzcG9uc2U6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICB2YXIgc2NoZW1hVXJsID0gcmVzcG9uc2UuY29uZmlnLmpzb25TY2hlbWFVcmw7XG5cbiAgICAgIGlmIChzY2hlbWFVcmwpIHtcbiAgICAgICAgdmFyIHVyaSA9IHNjaGVtYVVybC5yZXNwb25zZTtcblxuICAgICAgICBpZiAodXJpKSB7XG4gICAgICAgICAgcmV0dXJuIGpzb25WYWxpZGF0b3IudmFsaWRhdGVKc29uKHJlc3BvbnNlLmRhdGEsIHVyaSkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgICB9LCBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgJHdpbmRvdy5jb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9XG4gIH1cbn0pOyIsImFuZ3VsYXIubW9kdWxlKFwiYnQuanNvblZhbGlkYXRvclwiKS5mYWN0b3J5KFwianNvblZhbGlkYXRvclwiLCBmdW5jdGlvbiAoXG4gICRxLCAkaW5qZWN0b3IsICR3aW5kb3csIGpzb25TY2hlbWFDYWNoZVxuKSB7XG4gIC8vIEJlY2F1c2UgVFY0IGNhbiBvbmx5IHJlcG9ydCBfYWxsXyBtaXNzaW5nIFVSSXMgKHJhdGhlciB0aGFuIGp1c3QgdGhvc2UgbWlzc2luZyBmb3IgYVxuICAvLyBwYXJ0aWN1bGFyIHNjaGVtYSkgd2Uga2VlcCB0cmFjayBvZiBzY2hlbWEgcHJvbWlzZXMgdG8gbWFrZSBzdXJlIHdlIGRvbid0IHRyeSBhbmQgbG9hZFxuICAvLyB0aGUgc2FtZSBzY2hlbWEgbW9yZSB0aGFuIG9uY2UuXG4gIHZhciBzY2hlbWFQcm9taXNlcyA9IHt9O1xuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNjaGVtYVByb21pc2UodXJpKSB7XG4gICAgdmFyIHNjaGVtYSA9IGpzb25TY2hlbWFDYWNoZS5nZXQodXJpKTtcblxuICAgIC8vIElmIHRoZSBzY2hlbWEgaGFzIF9ub3RfIGJlZW4gcHJlLWxvYWRlZCBpbnRvIHRoZSBzY2hlbWEgY2FjaGVcbiAgICBpZiAoYW5ndWxhci5pc1VuZGVmaW5lZChzY2hlbWEpKSB7XG4gICAgICAvLyBUaGVuIGxvYWQgaXQgdXNpbmcgSFRUUFxuICAgICAgLy8gVXNlIGluamVjdG9yIHRvIGF2b2lkIGNpcmN1bGFyIGRlcGVuZGVuY2llcyBnaXZlbiB0aGF0IHRoaXMgaXMgYW4gSHR0cEludGVyY2VwdG9yXG4gICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnJGh0dHAnKS5nZXQodXJpKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vIE5vdGUgdGhhdCB3ZSBET04nVCBwdXQgaXQgaW4gdGhlIEpTT04gc2NoZW1hIGNhY2hlIC0gd2UncmUgZG9pbmcgb3VyIG93biBjYWNoaW5nXG4gICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE90aGVyd2lzZSBqdXN0IHdyYXAgaXQgaW4gYSBwcm9taXNlIGFuZCByZXR1cm4gaXRcbiAgICAgIHJldHVybiAkcS53aGVuKHNjaGVtYSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9hZFNjaGVtYSh1cmkpIHtcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGtpY2tlZC1vZmYgYSBsb2FkIGZvciB0aGUgc2NoZW1hIGluIHRoZSBwYXN0LCB0aGVuIHJldHVybiBpdC4gT3RoZXJ3aXNlLFxuICAgIC8vIGtpY2sgb2ZmIGEgbG9hZC5cbiAgICB2YXIgc2NoZW1hUHJvbWlzZSA9IHNjaGVtYVByb21pc2VzW3VyaV07XG5cbiAgICBpZighc2NoZW1hUHJvbWlzZSkge1xuICAgICAgc2NoZW1hUHJvbWlzZSA9IGNyZWF0ZVNjaGVtYVByb21pc2UodXJpKTtcbiAgICAgIHNjaGVtYVByb21pc2VzW3VyaV0gPSBzY2hlbWFQcm9taXNlO1xuICAgIH1cblxuICAgIHJldHVybiBzY2hlbWFQcm9taXNlO1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkU2NoZW1hKHVyaSkge1xuICAgIHJldHVybiBsb2FkU2NoZW1hKHVyaSkudGhlbihmdW5jdGlvbihzY2hlbWEpIHtcbiAgICAgIHR2NC5hZGRTY2hlbWEodXJpLCBzY2hlbWEpO1xuXG4gICAgICB2YXIgbWlzc2luZ1VyaXMgPSB0djQuZ2V0TWlzc2luZ1VyaXMoKTtcbiAgICAgIC8vIElmIHNjaGVtYXMgYXJlIG1pc3NpbmdcbiAgICAgIGlmIChtaXNzaW5nVXJpcy5sZW5ndGgpIHtcbiAgICAgICAgLy8gTG9hZCBhbmQgcmVnaXN0ZXIgdGhlbS5cbiAgICAgICAgdmFyIHJlZlNjaGVtYVByb21pc2VzID0gW107XG5cbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKG1pc3NpbmdVcmlzLCBmdW5jdGlvbihtaXNzaW5nVXJpKSB7XG4gICAgICAgICAgLy8gTm90ZSB0aGF0IHRoaXMgaXMgYSByZWN1cnNpdmUgb3BlcmF0aW9uLlxuICAgICAgICAgIHJlZlNjaGVtYVByb21pc2VzLnB1c2goYWRkU2NoZW1hKG1pc3NpbmdVcmkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIE9ubHkgcmVzb2x2ZSB3aGVuIGFsbCBvZiB0aGUgbWlzc2luZyBzY2hlbWFzIGhhdmUgYmVlbiBhZGRlZC4gSWRlYWxseSB3ZSdkIG9ubHkgYmVcbiAgICAgICAgLy8gd2FpdGluZyBvbiBzY2hlbWFzIHRoYXQgdGhlIGFkZGVkIHNjaGVtYSBkZXBlbmRzIG9uLCBidXQgdGhlcmUncyBubyB3YXkgdG8ga25vdy5cbiAgICAgICAgcmV0dXJuICRxLmFsbChyZWZTY2hlbWFQcm9taXNlcykudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gc2NoZW1hO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuICRxLndoZW4oc2NoZW1hKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFNjaGVtYSh1cmkpIHtcbiAgICB2YXIgc2NoZW1hID0gdHY0LmdldFNjaGVtYSh1cmkpO1xuICAgIHJldHVybiBzY2hlbWEgPyAkcS53aGVuKHNjaGVtYSkgOiBhZGRTY2hlbWEodXJpKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdmFsaWRhdGVKc29uOiBmdW5jdGlvbihvYmplY3QsIHNjaGVtYVVyaSkge1xuICAgICAgcmV0dXJuIGdldFNjaGVtYShzY2hlbWFVcmkpLnRoZW4oZnVuY3Rpb24oc2NoZW1hKSB7XG4gICAgICAgIGlmICh0djQudmFsaWRhdGUob2JqZWN0LCBzY2hlbWEpKSB7XG4gICAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHR2NC5lcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==