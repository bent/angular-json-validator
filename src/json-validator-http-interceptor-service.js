angular.module("bt.jsonValidator").factory("jsonValidatorHttpInterceptor", function (
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
});