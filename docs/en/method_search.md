# The SEARCH method

The HTTP `SEARCH` method is accessed in the CRUD service in the same way as the `GET` method. The exception is that in the body of the message it is possible to set the following conditions: *filter*, *sort* and *eager loading* format in the .json format in the notation of the `GetList` method of the data repository:

```javascript
{
  "filter": {
    "eq": ["attr3", "etalon"]
  },
  "forceEnrichment": [["attr1", "attr2"], ["col1"]]
  "sort": {
    "attr4": -1
  } 
}
```

```
curl -X GET -u admin@local:ION-admin http://modws-26.develop-and-test.kube.local/rest/crud/class_string@develop-and-test/
```