angular.module("jsonValidator").factory("jsonSchemaCache", function ($cacheFactory) {
  return $cacheFactory('jsonSchema');
});