# Метод SEARCH

Обращение к HTTP-методу `SEARCH` в сервисе CRUD осуществляется аналогично методу `GET`. Исключением является то, что в теле сообщения можно в формате .json задать условия *фильтрации*, *сортировки* и *жадной загрузки* в нотации метода `GetList` репозитория данных:

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