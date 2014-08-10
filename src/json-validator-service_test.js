describe("jsonValidator", function () {
  beforeEach(module("jsonValidator"));

  var jsonValidator, jsonSchemaCache, $rootScope,resolved, rejected, $httpBackend;

  function validate(object) {
    jsonValidator.validateJson(object, 'schema.json').then(function(object) {
      resolved = object;
    }, function(object) {
      rejected = object;
    });

    $rootScope.$digest();
  }

  function expectResolved(object) {
    expect(rejected).toBeUndefined();
    expect(resolved).toBe(object);
  }

  function expectRejected() {
    expect(rejected).toBeDefined();
    expect(resolved).toBeUndefined();
  }


  beforeEach(inject(function(_jsonValidator_, _jsonSchemaCache_, _$rootScope_, _$httpBackend_) {
    resolved = undefined;
    rejected = undefined;

    tv4.dropSchemas();
    jsonValidator = _jsonValidator_;
    jsonSchemaCache = _jsonSchemaCache_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('a schema that is in the cache', function() {
    describe('and does not reference another schema', function() {
      beforeEach(function() {
        jsonSchemaCache.put('schema.json', {
          "items": {
              "type": "boolean"
          }
        });
      });

      it('succeeds for JSON that matches the schema', function() {
        var object = [true, false];
        validate(object);
        expectResolved(object)
      });

      it('fails for JSON that does not match the schema', function() {
        validate([1]);
        expectRejected();
      })
    });

    describe('and references another schema', function() {
      beforeEach(function() {
        jsonSchemaCache.put('schema.json', {
          "items": {
            "$ref": "refSchema.json"
          }
        });
      });

      it('fails if referenced schema is not found', function() {
        $httpBackend.expectGET('refSchema.json').respond(404);

        validate([{test: "hello"}]);
        $httpBackend.flush();

        expectRejected();
      });

      describe('where the referenced schema exists', function() {
        beforeEach(function() {
          jsonSchemaCache.put('refSchema.json', {
              "type": "object",
              "properties": {
                  "test": {
                      "type": "string",
                      "required": true
                  }
              },
              "additionalProperties": false,
              "required": true
          });
        });

        it('resolves if the JSON is valid', function() {
          var object = [{test: "hello"}];
          validate(object);
          expectResolved(object);
        });

        it('rejects JSON that does not validate against the referenced schema', function() {
          var object = [{test: 1}];
          validate(object);
          expectRejected();
        });
      });

      describe('where the referenced schema refers to another schema', function() {
        beforeEach(function() {
          jsonSchemaCache.put('refSchema.json', {
              "type": "object",
              "properties": {
                  "sub": {
                      "$ref": "subRefSchema.json"
                  }
              },
              "additionalProperties": false,
              "required": true
          });
        });

        it('fails if the sub-referenced schema does not exist', function() {
          $httpBackend.expectGET('subRefSchema.json').respond(404);

          validate([{test: "hello"}]);
          $httpBackend.flush();

          expectRejected();
        });

        describe('where the sub-referenced schema exists', function() {
          beforeEach(function() {
            jsonSchemaCache.put('subRefSchema.json', {
                "type": "object",
                "properties": {
                  "test": {
                    "type": "string",
                    "required": true
                  }
                },
                "additionalProperties": false,
                "required": true
            });
          });

          it('resolves if the JSON is valid', function() {
            var object = [{sub: {test: "hello"}}];
            validate(object);
            expectResolved(object);
          });

          it ('rejects invalid JSON', function() {
            var object = [{sub: {test: 1}}];
            validate(object);
            expectRejected();
          });
        });
      });
    });

    describe('and references multiple schemas, one of which is in the cache', function() {
      beforeEach(function() {
        jsonSchemaCache.put('schema.json', {
          "type": "object",
          "properties": {
              "items": {
                "$ref": "refSchema1.json"
              },
              "sub": {
                  "$ref": "refSchema2.json"
              }
          },
          "additionalProperties": false,
          "required": true
        });
        jsonSchemaCache.put('refSchema1.json', {
            "type": "object",
            "properties": {
              "test": {
                "type": "string",
                "required": true
              }
            },
            "additionalProperties": false,
            "required": true
        });
      });

      it('fails if the other referenced schema does not exist', function() {
          $httpBackend.expectGET('refSchema2.json').respond(404);
          validate();
          $httpBackend.flush();
      });
    });
  });

  describe('a schema that is not in the cache', function() {
    var object = [true];

    describe('but can be fetched with HTTP', function() {
      beforeEach(function() {
        $httpBackend.expectGET('schema.json').respond({
          "items": {
              "type": "boolean"
          }
        });

        validate(object);
        $httpBackend.flush();
      });

      it('succeeds', function() {
        expectResolved(object);
      });

      it('does not try to fetch with HTTP again if validated again', function() {
        resolved = undefined;
        rejected = undefined;
        validate(object);
        expectResolved(object);
      });
    });

    it('fails if the schema cannot be fetched with HTTP', function() {
      $httpBackend.expectGET('schema.json').respond(404);

      validate(object);
      $httpBackend.flush();

      expectRejected();
    });
  });
});