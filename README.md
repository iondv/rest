This page in [Русском](/README_RU.md)

# IONDV. REST

REST - is a **IONDV. Framework** module used to quickly create web services
based on metadata for implementing microservice architecture. The module also allows you to
integrate applications created on the framework with other systems using the REST API and it
provides data exchange to the implement arbitrary user interfaces
(including [SPA](https://en.wikipedia.org/wiki/Single-page_application) created on the frameworks [Angular](https://angularjs.org), [Redux](https://redux.js.org), [Vue](https://ru.vuejs.org), etc.).

### IONDV. Framework in brief

**IONDV. Framework** - is a node.js open source framework for developing accounting applications
or microservices based on metadata and individual modules. Framework is a part of 
instrumental digital platform to create enterprise 
(ERP) apps. This platform consists of the following open-source components: the [IONDV. Framework](https://github.com/iondv/framework), the
[modules](https://github.com/topics/iondv-module) и ready-made applications expanding it
functionality, visual development environment [Studio](https://github.com/iondv/studio) to create metadata for the app.

* For more details, see [IONDV. Framework site](https://iondv.com). 

* Documentation is available in the [Github repository](https://github.com/iondv/framework/blob/master/docs/en/index.md).

## Description

**IONDV. REST** - module providing work with data of IONDV applications via `REST API`.
It's a cover to work with data via standart CRUD functions or it connects your own
application services, including those using the core API.

## Functionalities

Overview:

* [Service registration in application configuration](#регистрация-сервиса-в-конфигурации-приложения)
* [Authorization for service requests](#авторизация-при-запросах-к-сервисам)
* [Built-in module services](#встроенные-сервисы-модуля)
* [Service handler in the app](#реализация-обработчика-сервиса-в-приложении)

### Service registration in application configuration 

To connect services in the application, configure them in the global settings of the rest module in the deploy.json file of the application. For example:

```json
{
  "modules": {
    "rest": {
      "globals": {
        "di": {
          "simple": {
            "module": "applications/develop-and-test/service/SimpleRest"
          },
          "string-list": {
            "module": "applications/develop-and-test/service/String-list",
            "options": {
              "stringClassName": "class_string@develop-and-test",
              "dataRepo": "ion://dataRepo"
            }
          },
          "crud": {
            "module": "modules/rest/lib/impl/crud",
            "options": {
               "auth": "ion://auth",
               "dataRepo": "ion://securedDataRepo"
            }
          }
```

The path to the service registration is in the `deploy.json` file - `modules.rest.globals.di`, further specify the name of the service, which will be available at the following address `https://domain.com/rest/serviceName`, where `serviceName` - name of the service, set in the di, as in the example above `simple` or `string-list`. In the `module` attribute, specify the path to the js-file with a service handler with a relative path
the root of the framework. The handler can be both in the application and in any module or framework, including sample rest module handlers.

In the `options` property, the specific service parameters are set.

For example, for **crud** service:

* `dataRepo` filed - data repository with access control used for operations on objects
* `auth` field - authentication component used to obtain the current user account.

For **string-list** service:

used for data sampling

* `dataRepo` field - data repository, used for data sampling
* `stringClassName` field - class name of received objects

In this case, the `class_string@develop-and-test` class will be transferred to the `getList` method of the data repository.

```javascript

options.dataRepo.getList(options.stringClassName, {})

```

### Authentication for service queries

There are several ways to carry out the authorization:

#### Standart authorization services via the login account  

All services use the standard authorization mechanism by default, which implies the transfer of 	registration details in the header:

* authorization via basicAuth, for example:

```bash
curl -u demo@local:ion-demo https://dnt.iondv.com/rest/simple
```

* transfer of	registration details in the query header:
```bash
curl -H "auth-user: demo" -H "auth-pwd: ion-demo" -H "auth-user-type: local" https://dnt.iondv.com/rest/simple
```

or

```bash
curl -H "auth-user: demo@local" -H "auth-pwd: ion-demo" https://dnt.iondv.com/rest/simple
```


#### No authentication services

To implement the service without authentication, you must set the `none` parameter in the `deploy.json` file:

```json
{
  "modules": {
    "rest": {
      "globals": {
        "authMode": {
          "echo": "none"
```

A query to a service will not require authentication, an example query - `curl https://dnt.iondv.com/rest/echoo`

#### Services with token authentication

Token authentication is used to exclude the constant transfer of an account in queries. Tokens are limited in their lifetime.

To implement the work of the service with authentication through a token, you must set the `token` parameter in the `authMode` in the `deploy.json` file:

```json
{
  "modules": {
    "rest": {
      "globals": {
        "authMode": {
          "echo-token": "token"
```

Authentication through the token is carried out by sending the token value for the `auth-token` parameter in the request header:

```bash
curl -H "auth-token: c369a361db9742e9a9ae8e9fe55950a571493812" http://dnt.iondv.com/rest/echo-token
```

You can get a token in two ways: in the console of the ionadmin module or through the `token` service of the rest module.

All generated tokens are stored in the collection `ion_user_tokens` in the database.

##### Getting a constant token through the ionadmin module

To get a token through the admin console, go to the "Web Services Security Keys" navigation item of the ionadmin module, by going to `locahost:8888/ionadmin/token`.

On the "Security Token Generator" page:

* Enter the user name in the "User name" field
* Set the "Account Type" field to "local"
* Click the "Generate token" button
* In the "Token" field the token value as follows `3a546090355317c287886c0e81dfd304fa5bda99` will appear. Use it as the `auth-token` header value.

The default token lifetime is 100 years.

##### Getting a temporary token through the rest/token service

The second way to get the token is to use the web service of the rest module - `token`. You can get a token through
authenticated request to the `rest/token` address. For example, through the authorization basicAuth type:

```bash
curl -u demo@local:ion-demo https://dnt.iondv.com/rest/token
```
or a request with authorization through the parameters in the header:

```bash
curl -H "auth-user: demo@local" -H "auth-pwd: ion-demo" -H https://dnt.iondv.com/rest/token
```

The service response will have a token of the form `e444c69894d2087696e0a6c6914788f67ebcf6ee`. The default token lifetime is 100 years.

To execute the request, you must either have administrator rights in the system or have `use` rights for the `ws:::gen-ws-token` resource.

You can add a token generation resource for a role from the command line `node bin/acl.js --role restGrp --p USE --res ws:::gen-ws-token` (where restGrp - name of existing group)
 
The second way to add rights to a resource is to use the admin console of the ionadmin module, for example, by going to `locahost:8888/ionadmin/`:

* Select the "Security" navigation item,
* Select the Roles navigation subitem,
* Select an existing role and click the edit or create a new role buttons, 
* In the "Access righrs" field, select the Services item,
* Expand the list of rights for the "Generation of security tokens through web services (ws ::: gen-ws-token)" resource,
* Select "Use" and click "Save".

### Built-in module services

The REST module has several built-in services designed to implement typical operations with the module:

* `acceptor` - service provides mass creation of objects
* `token` -  service provides the issuance of a token for an authorized user
* `crud` - CRUD service for system objects

#### Built-in "acceptor" service

The `acceptor` service designed for mass storage of objects of different classes.

It is required to register the service in the deploy.json application configuration file to work with the service. At the same time, the service must be indicated in the `options` - the `dataRepo` and `metaRepo` repositories. For example:

```json
{
  "modules": { 
    "rest": {
      "globals": {
        "di": {
          "acceptor": {
            "module": "modules/rest/lib/impl/acceptor",
            "options": {
              "dataRepo": "ion://dataRepo",
              "metaRepo": "ion://metaRepo"
            }
          }
```

Authorization is carried out through all the main types of access, and by default through the user account.

The service is carried out by the `POST` method, objects are transferred as an array of objects in JSON format in the request body with the json content header `Content-Type:application/json`. Auto-generated fields are optional.

In the header in the `ion-converter` property, the name of the converter that can be used when processing data can be passed.
Both request data and response data. In this case, the data converter itself must be registered in the `options` service.
If no handler is specified, the default handler is used.

The object data must include:

* `_id` - identifier of the object by key field
* `_class` - object class with namespace
* `_classVer` - class version

The remaining values must match the properties of the class, including data type matching. Example.

```bash
curl -X POST -u demo@local:ion-demo \
   -H "Content-Type:application/json" \
   -d '[{"_class": "class_string@develop-and-test", "__classVer": null,"id": "10101010-5583-11e6-aef7-cf50314f026b",\
       "string_text": "Example10", "string_miltilinetext": "Example10", "string_formattext": "Example10"}]' \
   https://dnt.iondv.com/rest/acceptor
```

The method returns the code `200` and an array of stored objects.

```json
[
  {
    "id": "10101010-5583-11e6-aef7-cf50314f026b",
    "_class": "class_string@develop-and-test",
    "_classVer": "",
    "string_formattext": "Example10",
    "string_miltilinetext": "Example10",
    "string_text": "Example10",
    "_id": "10101010-5583-11e6-aef7-cf50314f026b"
  }
]
```

In case of an error, the response code will be `400`, and the response text will contain

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Bad Request</pre>
</body>
</html>
```

#### Built-in service "token"

The `token` service is intended for issuing a token to an authenticated user, for its further use in token authentication services.

The service does not require registration in deploy.json. The service provides the issuance of a token for an authorized user, 
if he has the `use` rights for the `ws:::gen-ws-token` resource or has administrator rights. In response to the request, there is a token of the following type `e444c69894d2087696e0a6c6914788f67ebcf6ee`. The default token lifetime is 100 years.

Request example via authentication of the basicAuth type:

```bash
curl -u demo@local:ion-demo https://dnt.iondv.com/rest/token
```
 
Example request with authentication through parameters in the header

```bash
curl -H "auth-user: demo@local" -H "auth-pwd: ion-demo" -H "auth-user-type: local" https://dnt.iondv.com/rest/token
```

#### Built-in service "crud"

The `crud` service implements a REST API based on the basic CRUD operations (create, read, update, delete).

The service requires registration in deploy.json of the application and requires a mandatory data source `dataRepo` in `options` of the service, as well as the authorization source `auth` to access user data.
It is advisable to specify as a data repository - a repository with full security processing in order to test the access to objects taking into account dynamic security. For example:

```json
{
  "modules": { 
    "rest": {
      "globals": {
        "di": {
          "crud": {
            "module": "modules/rest/lib/impl/crud",
            "options": {
              "auth": "ion://auth",
              "dataRepo": "ion://securedDataRepo"
            }
          }
```

Authentication is done through all the main types of access, and by default through a user account.

Example:

```bash
curl -X POST -u demo@local:ion-demo https://dnt.iondv.com/rest/crud
```

By default, without the correct parameters - server response code about the error is `404`. 

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot POST /rest/crud</pre>
</body>
</html>
```

##### Getting a list of objects: GET crud/:class@namespace method

Getting a list of objects is carried out by the `GET` method, while indicating the class code with a namespace, for example `rest/crud/class_string@develop-and-test/`

```bash
curl -X GET -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/
```
In response, the service returns a JSON Object with an offset of 0 and a count of 5 records and a status of `200`, if there is no such class, returns the code `404`.

```json
[{"_creator":"admin@local",
"_id":"4567a830-b8ea-11e9-9cdf-7bd384cbb7a5",
"__string":"example1",
"__class":"class_string@develop-and-test",
"__classTitle":"Class \"String [0]\"",
"id":"4567a830-b8ea-11e9-9cdf-7bd384cbb7a5",
"string_text":"example1",
"string_miltilinetext":"example1",
"string_formattext":"<p>example1</p>"},
{"_id":"66dbb3d0-5583-11e6-aef7-cf50314f026b",
"__string":"Example of the \"String [0]\" type in the \"Text [1]\" view",
"__class":"class_string@develop-and-test",
"__classTitle":"Class \"String [0]\"",
"id":"66dbb3d0-5583-11e6-aef7-cf50314f026b",
"string_text":"Example of the \"String [0]\" type in the \"Text [1]\" view",
"string_miltilinetext":"Example of the \"String [0]\"\r\n in the Multiline text [7] view",
"string_formattext":"Example of the \r\n \"String [0]\" type \r\n in the \r\nFormatted text [7] view"}]
```

The query can be implemented with the following query parameters:

* `_offset` - sample offset, 0 - by default
* `_count` - number of values in the sample, 5 - by default
* `_eager` - a list of class properties, separated by the symbol `|` for which it is necessary to configure the data eager loading.
* `[name of property]` - all parameters are accepted by the request name, except those starting with `_` which are considered the names of the class attributes, and their values are set as filters.

Examples:

```bash
# Запрос списка объектов класса со смещением 1 и кол-вом 2
curl -X GET -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/?_offset=1&_count=2
# Запрос списка объектов, у которы свойство string_text имеет значение example1
curl -X GET -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/?string_text=example1
# Запрос списка объектов, у которы свойство string_text имеет значение example1, со смещением 1 и кол-вом 2
curl -X GET -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/?string_text=example1&_offset=1&_count=2
```

##### Check of the object availability: HEAD crud/:class@namespace/:id method

Check of the object availability is carried out by the `GET` method, while indicating the class code with a namespace and the value of the object key, for example `rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b`

```bash
curl -X HEAD -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b
```

If the object exists, it returns the response code `200`, if the object does not find the code is `404`, if there is no correct rights - `403`.

##### Receiving object: GET crud/:class@namespace/:id method

Obtaining an object is carried out by the `GET` method, while indicating the class code with a namespace and the value of the object key, for example `rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b`

```bash
curl -X GET -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b
```

In addition, you can set the `_eager` parameter in the query containing a list of class properties, separated by the `|` symbol
for which it is necessary to configure the data eager loading (links or collections). For example:

```bash
curl -X GET -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b?_eager=string_text
```

If the object exists, it returns the response code `200` and the object itself in json format, if the object does not find the code is `404`, if there is no correct rights - `403`.

```json
{
    "_id": "66dbb3d0-5583-11e6-aef7-cf50314f026b",
    "__string": "Example of the \"String [0]\" type in the \"Text [1]\" view",
    "__class": "class_string@develop-and-test",
    "__classTitle": "Class \"String [0]\"",
    "id": "66dbb3d0-5583-11e6-aef7-cf50314f026b",
    "string_text": "Example of the \"String [0]\" type in the \"Text [1]\" view",
    "string_miltilinetext": "Example of the \"String [0]\"\r\n in the Multiline text [7] view",
    "string_formattext": "Example of the \r\n \"String [0]\" type \r\n in the \r\nFormatted text [7] view"
}
```

##### Object creation: POST crud/:class@namespace method

An object is created using the `POST` method, and the class code with a namespace is specified, `rest/crud/class_string@develop-and-test`. The object itself is transmitted in the request body in json format with obligatory indication in the header of the json content type `Content-Type:application/json`. Auto-generated fields are optional. Example:

```bash
curl -X POST -u demo@local:ion-demo \
   -H "Content-Type:application/json" \
   -d '{"string_text": "Example3", "string_miltilinetext": "Example3", "string_formattext": "Example3"}' \
   https://dnt.iondv.com/rest/crud/class_string@develop-and-test/
```

The created object will be returned in response, in which all auto-created fields will be filled and the response code will be  `200`.

```json
{
    "_creator": "admin@local",
    "_id": "10c77900-b96e-11e9-a7ce-314f02bd4197",
    "__string": "10c77900-b96e-11e9-a7ce-314f02bd4197",
    "__class": "class_string@develop-and-test",
    "__classTitle": "Class \"String [0]\"",
    "id": "10c77900-b96e-11e9-a7ce-314f02bd4197",
    "string_text": "Example3",
    "string_miltilinetext": "Example3",
    "string_formattext": "Example3"
}
```

In case of an error, the response code will be `400`, and the response text will contain:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Bad Request</pre>
</body>
</html>
```

##### Object update: PATCH or PUT crud/:class@namespace/:id method

Updating an object is done using the `PATCH` or` PUT` method, and the class code with neispace and the value of the object key are indicated, for example `rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b`. The object itself is transmitted in the request body in json format with obligatory indication in the header of the json content type - `Content-Type:application/json`. 

Example:

```bash
curl -X PATCH -u demo@local:demo-ion -H "Content-Type:application/json" -d '{"string_text": "NEW Example", "string_miltilinetext": "NEW Example", "string_formattext": "NEW Example"}' https://dnt.iondv.com/rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b
# Or it is equivalent
curl -X PUT -u demo@local:demo-ion -H "Content-Type:application/json" -d '{"string_text": "NEW Example", "string_miltilinetext": "NEW Example", "string_formattext": "NEW Example"}' https://dnt.iondv.com/rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b
```


If the object exists, it returns the response code `200` and the object itself in json format, if the object does not find the code is `404`, if the processing fails, the code is `500`, if there is no correct rights - `403`.

Object example:

```json
{
    "_editor": "admin@local",
    "_id": "66dbb3d0-5583-11e6-aef7-cf50314f026b",
    "__string": "NEW Example",
    "__class": "class_string@develop-and-test",
    "__classTitle": "Class \"String [0]\"",
    "id": "66dbb3d0-5583-11e6-aef7-cf50314f026b",
    "string_text": "NEW Example",
    "string_miltilinetext": "NEW Example",
    "string_formattext": "NEW Example"
}
```

##### Delete object: DELETE crud/:class@namespace/:id method

Deleting an object is carried out by the `DELETE` method, while indicating the class code with a namespace and the value of the object key, 
for example `rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b`.

```bash
curl -X DELETE -u demo@local:demo-ion https://dnt.iondv.com/rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b
```

If successful, the service returns the response code `200`, in case the object was not found `404`.


### Service сreation

Creating your own service consists of the following:

* service registration in deploy.json
* creating a service handler in the application
* implementation of request processing logic

#### Service registration in deploy.json application

Test service registration example, for details see [Service registration in application configuration](#регистрация-сервиса-в-конфигурации-приложения)

```json
{
  "modules": { 
    "rest": {
      "globals": {
        "di": {
          "string-list": {
            "module": "applications/develop-and-test/service/String-list",
            "options": {
              "stringClassName": "class_string@develop-and-test",
              "dataRepo": "ion://dataRepo"
            }
          }        
```

#### Development of the service handler in the app

All services are implemented as heirs from Service - functions of the rest module.

Each service must export a handler function in which an asynchronous method `this._route` are implemented. It is necessary to register processed methods and paths, throuth the `this.addHandler` functions, returning the Promise . Handler function
will have access to `options` and the access to the data repositories, authorization, metadata and classes (if they are specified in the application configuration in the deploy.json file) and will also receive an object with the generic name `req` - which is the `request` object of the [express](https://expressjs.com/en/4x/api.html#req) library.

The data, already parsed into the object will be located in `req.body`.
 
The handler function must return a Promise resolving to the result of the handler (for processing in Service `modules/rest/lib/interfaces/Service.js`), the handler will issue it with a code of 200 and a content type - `Content-Type:application/json`. 
If during processing there will be an error intercepted by catch, then for errors related to access control, an answer with an error text and code will be returned `403`, and for everything else, the response code `500` and error message `Internal server error`. 
 
An example of implementing a service issuing lists of objects with filters for a `class_string` class in the [develop-and-test] application.

It is also convenient to study the crud method itself, located at `modules/rest/lib/impl/crud.js`

```javascript
const Service = require('modules/rest/lib/interfaces/Service');

/**
 * @param {{dataRepo: DataRepository, echoClassName: String}} options
 * @constructor
 */
function listClassString(options) {

  /**
   * @param {Request} req
   * @returns {Promise}
   * @private
   */
  this._route = function(router) {
    this.addHandler(router, '/', 'POST', (req) => {
      return new Promise(function (resolve, reject) {
        try {
          let filter = [];
          if (req.body.string_text)
            filter.push({string_text: {$eq: req.body.string_text}});
          if (req.body.string_miltilinetext)
            filter.push({string_miltilinetext: {$eq: req.body.string_miltilinetext}});
          if (filter.length === 0)
            filter = {};
          else if (filter.length === 1)
            filter = filter[0];
           else
            filter = {$and: filter};
          options.dataRepo.getList(options.stringClassName, {filter: filter}).then(function (results) {
            let items = [];
            for (let i = 0; i < results.length; i++) {
              const props = results[i].getProperties();
              const item = {};
              for (let p in props) {
                if (props.hasOwnProperty(p))
                  item[props[p].getName()] = props[p].getValue();
              }
              items.push(item);
            }
            resolve({data: items});
          });
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}

listClassString.prototype = new Service();

module.exports = listClassString;
```

Query without attributes in the query body:

```bash
curl -X POST -u demo@local:ion-demo https://dnt.iondv.com:8888/rest/string-list
```

Returns all the list:

```json
[{"__class":"class_string@develop-and-test",
  "__classTitle":"Class \"String [0]\"",
  "id":"4567a830-b8ea-11e9-9cdf-7bd384cbb7a5",
  "string_text":"example1",
  "string_miltilinetext":"example1",
  "string_formattext":"<p>example1</p>"},
{"__class":"class_string@develop-and-test",
  "__classTitle":"Class \"String [0]\"",
  "id":"4a80bdc0-b8ea-11e9-9cdf-7bd384cbb7a5",
  "string_text":"example1",
  "string_miltilinetext":"example2",
  "string_formattext":"<p>example2</p>"},
{"__class":"class_string@develop-and-test",
  "__classTitle":"Class \"String [0]\"",
  "id":"66dbb3d0-5583-11e6-aef7-cf50314f026b",
  "string_text":"Example of the \"String [0]\" type in the \"Text [1]\" view",
  "string_miltilinetext":"Example of the \"String [0]\"\r\n in the Multiline text [7] view",
  "string_formattext":"Example of the \r\n \"String [0]\" type \r\n in the \r\nFormatted text [7] view"}]
```

A query with an attribute parameter equal to the value in the attribute string_text:

`Example of the \"String [0]\" type in the \"Text [1]\" view`

```bash
curl -X POST -d "string_text=Example of the \"String [0]\" type in the \"Text [1]\"" \
     -u demo@local:ion-demo https://dnt.iondv.com:8888/rest/string-list
```

Returns the objects objects satisfying the condition:

```json
[{"__class":"class_string@develop-and-test",
  "__classTitle":"Class \"String [0]\"",
  "id":"66dbb3d0-5583-11e6-aef7-cf50314f026b",
  "string_text":"Example of the \"String [0]\" type in the \"Text [1]\" view",
  "string_miltilinetext":"Example of the \"String [0]\"\r\n in the Multiline text [7] view",
  "string_formattext":"Example of the \r\n \"String [0]\" type \r\n in the \r\nFormatted text [7] view"}]
```

--------------------------------------------------------------------------  

 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com) &ensp;  [Russian](/README_RU.md)         

--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 