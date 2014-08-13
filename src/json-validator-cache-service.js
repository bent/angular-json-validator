angular.module("bt.jsonValidator").factory("jsonSchemaCache", function ($cacheFactory) {
  return $cacheFactory('jsonSchema');
});