# Сервис исполнения бизнес-процесса

## Принцип сервиса

Сервис маппится для всех методов на один путь вида `/:class/:id` для идентификации обьекта данных.

Сервис содержит три метода:
* `GET` - без параметров, возвращает информацию о текущем статусе в БП (возможные переходы)
* `PUT` - выполняет перевод обьекта в указанные **следующие** этапы разных БП.
* `PATCH` - выполняет принудительный перевод обьекта в указанные этапы разных БП.

## Спецификация методов:

### Метод GET
Получение текущего положения обьекта в БП:
```
'/:class/:id', 'GET'
``` 

### Метод PUT
Выполнение переходов объекта по БП (в том числе последовательных):
```
'/:class/:id', 'PUT' 
{
  "workflow1@namespace": [
    "transiton1", // сначала первый переход
    "transition2" // следом второй переход
  ],
  "workflow2@namespace": [
    "transition1",
    "transition2"
  ]
}
```
Для метода **PUT** передаем в теле запроса один из вариантов:
* массив переходов;
* объект у которого атрибутами являются имена БП, а значениями атрибутов - массивы переходов.

В методе **PUT** последовательно проводим объект по указанным переходам бизнес процесса. В случае возникновения ошибки при переходе фиксируем ее, чтобы вернуть в ответе, и выполняем следующий переход.

### Метод PATCH
Принудительное перемещение объекта в указанные состояния БП:
```
'/:class/:id', 'PATCH' 
["workflow1@namespace.state1", "workflow2@namespace.state2"]
```
Для метода **PATCH** передаем в теле запроса массив состояний разных БП. Последовательно помещаем обьект в каждое из переданных состояний.


## Пример

Запрос (метод GET):
```
curl -X GET -u demo@local:ion-demo http://dnt.iondv.com/rest/crud/workflowBase@develop-and-test/1
```

Ответ:
```
{
    "_id":"1",
    "__string":"1",
    "__class":"workflowBase@develop-and-test",
    "__classTitle":"Class of the WF object",
    "id":1,"stage":"checked",
    "stage_str":"Checked",
    "quantaty":12,
    "result":"Ready",
    "person":"admin@local",
    "creatorDefault":"admin@local"
}
```