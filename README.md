angular-json-validator
======================

Angular services for validating JSON. Uses [tv4](https://github.com/geraintluff/tv4) under the hood, so is only able to work with JSON Schema v4.

* Includes an HTTP Interceptor service that can validate request and response data
* Recursively loads `$ref` schemas (ie, schemas that are referenced inside other schemas)
* Supports precompilation of schemas into an Angular cache to avoid HTTP calls

Installation
------------

1. Install with [bower](http://bower.io/):

        bower install angular-json-validator
    
   Or manually download 
   [`angular-json-validator.js`](https://github.com/bent/angular-json-validator/blob/master/angular-json-validator.js) and
   [`tv4.js`](https://github.com/geraintluff/tv4/blob/master/tv4.js) or
   [`tv4.min.js`](https://github.com/geraintluff/tv4/blob/master/tv4.min.js).

2. Include the JS files in your project. `angular-json-validator.js` should be loaded after `angular.js`.
3. If you want to use the HTTP Interceptor, add `bt.jsonValidator` as a dependency of your application module. For example:

        angular.module('myApp', ['bt.jsonValidator', ...]) {
          ...
        });

   If you just want to use the `JsonValidator` service, include `bt.jsonValidator` as a dependency of whatever module is
   using it. For example:
   
        angular.module('myModule', ['bt.jsonValidator', ...]) {
          ...
        });
   
   


