describe("jsonValidatorHttpInterceptor", function () {
  beforeEach(module("bt.jsonValidator"));

  var jsonValidatorHttpInterceptor, jsonValidator, $window, $rootScope, returnValue, deferred,
    config, resolve, reject;

  beforeEach(inject(function(
      _jsonValidatorHttpInterceptor_, _jsonValidator_, _$window_, $q, _$rootScope_
  ) {
    jsonValidatorHttpInterceptor = _jsonValidatorHttpInterceptor_;
    jsonValidator = _jsonValidator_;
    $window = _$window_;
    $rootScope = _$rootScope_;
    config = {};
    resolve = jasmine.createSpy();
    reject = jasmine.createSpy();
    deferred = $q.defer();
    returnValue = undefined;

    spyOn(jsonValidator, 'validateJson').andReturn(deferred.promise);
  }));

  describe('request()', function() {
    describe('when json schema is not specified', function() {
      it ('does no validation', function() {
        returnValue = jsonValidatorHttpInterceptor.request(config)
        expect(returnValue).toBe(config);
        expect(jsonValidator.validateJson).not.toHaveBeenCalled();
      });
    });

    describe('when json schema is specified', function() {
      var requestData;

      beforeEach(function() {
        config.jsonSchemaUrl = {request: 'schemaUri'};
        requestData = {};
        config.data = requestData;
      });

      describe('and request data is provided', function() {
        beforeEach(function() {
          returnValue = jsonValidatorHttpInterceptor.request(config);
          expect(jsonValidator.validateJson).toHaveBeenCalledWith(requestData, 'schemaUri');
          returnValue.then(resolve, reject);
        });

        it('resolves with the config if the schema matches', function() {
          deferred.resolve();
          $rootScope.$digest();
          expect(resolve).toHaveBeenCalledWith(config);
          expect(reject).not.toHaveBeenCalled();
        });

        describe('and does not match schema', function() {
          var error;

          beforeEach(function() {
            spyOn($window.console, 'error');
            error = {};
            deferred.reject(error);
            $rootScope.$digest();
          });

          it('logs the error to the console', function() {
            expect($window.console.error).toHaveBeenCalledWith(error);
          });

          it('rejects with the config', function() {
            expect(resolve).not.toHaveBeenCalled();
            expect(reject).toHaveBeenCalledWith(config);
          });
        });
      });
    });
  });

  describe('response()', function() {
    var response, responseData = {};

    beforeEach(function() {
      response = {config: config, data: responseData};
    });

    describe('when json schema is not specified', function() {
      it ('does no validation', function() {
        returnValue = jsonValidatorHttpInterceptor.response(response);
        expect(returnValue).toBe(response);
        expect(jsonValidator.validateJson).not.toHaveBeenCalled();
      });
    });

    describe('when json schema is specified', function() {
      beforeEach(function() {
        config.jsonSchemaUrl = {response: 'schemaUri'};
      });

      describe('and response data is provided', function() {
        beforeEach(function() {
          returnValue = jsonValidatorHttpInterceptor.response(response);
          expect(jsonValidator.validateJson).toHaveBeenCalledWith(responseData, 'schemaUri');

          returnValue.then(resolve, reject);
        });

        it('resolves with the response if the schema matches', function() {
          deferred.resolve();
          $rootScope.$digest();
          expect(resolve).toHaveBeenCalledWith(response);
          expect(reject).not.toHaveBeenCalled();
        });

        describe('and does not match schema', function() {
          var error;

          beforeEach(function() {
            spyOn($window.console, 'error');
            error = {};
            deferred.reject(error);
            $rootScope.$digest();
          });

          it('logs the error to the console', function() {
            expect($window.console.error).toHaveBeenCalledWith(error);
          });

          it('rejects with the response', function() {
            expect(resolve).not.toHaveBeenCalled();
            expect(reject).toHaveBeenCalledWith(response);
          });
        });
      });
    });
  })
});