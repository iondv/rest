Эта страница на [English](/README.md)

# IONDV. REST

REST - модуль IONDV. Framework применяется для быстрого создания веб-сервисов на 
основе метаданных для реализации микросервисной архитектуры. Модуль позволяет также 
интегрировать приложения созданные на фреймворке с другими системами по REST API и 
обеспечивает обмен данными для реализации произвольных пользовательских веб-интерфейсов 
(в том числе SPA созданные на фреймворках Angular, Redux, Vue и т.д.) или для бакендчасти мобильных приложений.

### Кратко об IONDV. Framework
IONDV. Framework - это опенсорный фреймворк на node.js для разработки учетных приложений 
или микросервисов на основе метаданных и отдельных модулей. Он является частью 
инструментальной цифровой платформы для создания enterprise 
(ERP) приложений состоящей из опенсорсных компонентов: самого [фреймворка](https://github.com/iondv/framework), 
[модулей](https://github.com/topics/iondv-module) и готовых приложений расширяющих его 
функциональность, визуальной среды [Studio](https://github.com/iondv/studio) для 
разработки метаданных приложений.

Подробнее об [IONDV. Framework на сайте](https://iondv.com), документация доступна в [репозитории на github](https://github.com/iondv/framework/blob/master/docs/en/index.md)

## Описание и назначение модуля

**IONDV. REST** - модуль обеспечивающий работу с данными приложения IONDV через `REST API`. 
Является оберткой для работы с данными через стандартные функции CRUD или подключает собственные 
сервисы приложения, в том числе использующие API ядра.

Дополнительно:
* [Регистрация сервиса в конфигруации приложения](#регистрация-сервиса-в-конфигурации-приложения)
* [Авторизация при запросах к сервисам](#авторизация-при-запросах-к-сервисам)
* [Встроенные сервисы модуля](#встроенные-сервисы-модуля)
* [Реализация обработчика сервиса в приложении](#реализация-обработчика-сервиса-в-приложении)
* [Дополнительные сервисы модуля](#дополнительные-сервисы)

### Регистрация сервиса в конфигурации приложения 
Для подключения сервисов в приложении их необходимо сконфигурировать в глобальных настройках модуля rest в файле 
deploy.json приложения. Пример приведен ниже.

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

Путь к регистрациям сервиса в файле `deploy.json` - `modules.rest.globals.di`, далее указывается название сервиса, которое
будет доступно по адресу `https://domain.com/rest/serviceName`, где serviceName - имя сервиса, указываемого в di, например
в примере выше `simple` или `string-list`. В атрибуте `module` указывается путь к js-файлу с обработчиком сервиса с путем относительно
корня фреймворка. Обработчик может быть как в приложении, так и в любом модуле или фреймворке, в т.ч. типовые обработчики модуля rest.

В параметре `options` указываются специфические настройки сервиса.
Например, для сервиса **crud** указаны:
* в поле `dataRepo` - репозиторий данных с контролем доступа, используемый для операций над обьектами 
* в поле `auth`- компонент аутентификации, используемый для получения текущей учетной записи пользователя.
А для сервиса **string-list** указаны:
* в поле `dataRepo` - репозиторий данных, используемый для выборки данных
* в поле `stringClassName` - имя класса получаемых обьектов
в данном случае класс `class_string@develop-and-test` будет передан в метод `getList` репозитория данных
```javascript
options.dataRepo.getList(options.stringClassName, {})
````

### Аунтентификация при запросах к сервисам
Авторизация может осуществляться следующими способами.

#### Сервисы со стандартрным механизмом авторизации по учетной записи
Все сервисы по умолчанию используют стандартный механизм авторизации, подразумевающий передачу учетных данных в заголовке:
* путем авторизации через basicAuth, пример 
```bash
curl -u demo@local:ion-demo https://dnt.iondv.com/rest/simple
```
* путем передачи учетных данных в заголовках запроса
```bash
curl -H "auth-user: demo" -H "auth-pwd: ion-demo" -H "auth-user-type: local" https://dnt.iondv.com/rest/simple
```

или

```bash
curl -H "auth-user: demo@local" -H "auth-pwd: ion-demo" https://dnt.iondv.com/rest/simple
```


#### Сервисы без аутентификации
Для реализации работы сервиса без аутентификации, необходимо задать для него значение `none` в настройке `authMode` в `deploy.json`

```json
{
  "modules": {
    "rest": {
      "globals": {
        "authMode": {
          "echo": "none"
```

Запрос к сервису не будет требовать аутентификации, пример запроса `curl https://dnt.iondv.com/rest/echoo`

#### Сервисы с аутентификацией через токен
Аутентификация по токену используется для исключения постоянной передачи учетной записи в запросах.
Токены ограничены по времени жизни.

Для реализации работы сервиса с аутентификацией через токен, необходимо задать для него значение `token` в настройке `authMode` в `deploy.json`
```json
{
  "modules": {
    "rest": {
      "globals": {
        "authMode": {
          "echo-token": "token"
```

Аутентификация через токен осуществляется путем отправки значения токена в заголовке запроса `auth-token`  
```bash
curl -H "auth-token: c369a361db9742e9a9ae8e9fe55950a571493812" http://dnt.iondv.com/rest/echo-token
```

Получение токена возможно двумя способами: в консоли модуля ionadmin или через сервис `token` модуля rest.

Все сгенерированные токены хранятся в коллекции `ion_user_tokens` в базе данных приложения

##### Получение постоянного токена через модуль ionadmin 
Для получения токена через консоль администратора перейдите в пункт навигации "Ключи безопасности веб-сервисов" 
модуля ionadmin, например перейдя по адресу `locahost:8888/ionadmin/token`

На странице "Генератор токенов безопасности":
* Введите имя пользоватля в поле "Имя пользователя"
* Укажите в поле "Тип учетной записи" значение "local"
* Нажмите кнопку "Сгенерировать токен"
* В поле "Токен" появится значение токена подобное `3a546090355317c287886c0e81dfd304fa5bda99`, его и нужно использовать 
как значение заголовка `auth-token`.

Время жизни токена созданного по умолчанию 100 лет.

##### Получение временного токена через сервис rest/token
Вторым способом получения токена является использование веб-сервиса модуля rest - `token`. Получить токен можно через 
аутентифицированный запрос на адрес `rest/token`. Например через авторизацию типа basicAuth:
```bash
curl -u demo@local:ion-demo https://dnt.iondv.com/rest/token
```
или запрос с авторизацией через параметры в заголовке:
```bash
curl -H "auth-user: demo@local" -H "auth-pwd: ion-demo" -H https://dnt.iondv.com/rest/token
```

В ответе сервиса будет токен вида `e444c69894d2087696e0a6c6914788f67ebcf6ee`. Время жизни токена по умолчанию 100 лет.

Для выполнения запроса нужно или обладать администраторскими правами в системе или иметь права `use` для ресурса `ws:::gen-ws-token`

Добавить ресурс возможности генерации токенов для роли, можно из комадной строки `node bin/acl.js --role restGrp --p USE --res ws:::gen-ws-token`
(где restGrp название существующей группы)
 
Вторым способом добавления прав на ресурс - использование консоли администратора модуля ionadmin, например, перейдя по
 адресу `locahost:8888/ionadmin/`:
* Выберите пункт навигации "Безопасность", 
* Выберите подпункт навигации "Роли"
* Выберите существующую роль и нажмите кнопку редактировать или создать новую роль. 
* В поле "Права доступа" роли выберите вкладку "Services"
* Раскройте список прав для ресурса "Генерация токенов безопасности посредством веб-сервисов (ws:::gen-ws-token)"
* Выбрать пункт "Использование" и нажмите кнопку "Сохранить"

### Встроенные сервисы модуля

Модуль REST имеет несколько встроенных сервисов предназначенных для реализации типовых операций с модулем:
* `acceptor` - сервис обеспечивает массовое создание объектов
* `token` - сервис обеспечивает выдачу токена для авторизованного пользователя
* `crud` - сервис CRUD для объектов системы

#### Встроенный сервис "acceptor"
Сервис `acceptor` предназначен для массового сохранения объектов разных классов. 

Для работы с сервисом требуется его регистрация в файле конфигураций приложений deploy.json. При этом для сервиса 
обязательно должны быть указаны в `options` репозитории `dataRepo` и `metaRepo`. Например

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

Авторизация осуществляется через все основные типы доступа, а по умолчанию через учетную запись пользователя.

Сервис работает по методу `POST`, объекты передаются в виде массива объектов в формате JSON в теле запроса с обязательным 
указанием в заголовке содержания json `Content-Type:application/json`. Автосоздаваемые поля указывать не обязательно. 

В заголовке (header) в свойстве `ion-converter` может быть передано имя конвертора, который нужно использовать при обработке данных.
Как данных запроса, так и данных ответа. При этом сам конвертор данных должные быть зарегистрирован в `options` сервиса.
Если обработчик не указан, используется обработчик по умолчанию.

В данных объекта обязательно указываются:
* `_id` - идентификатор объекта по ключевому полю
* `_class` - класс объекта с неймспейсом
* `_classVer` - версия класса

Остальные значения должны соответствовать свойствам класса, включая соответствие типов данных. Пример.

```bash
curl -X POST -u demo@local:ion-demo \
   -H "Content-Type:application/json" \
   -d '[{"_class": "class_string@develop-and-test", "__classVer": null,"id": "10101010-5583-11e6-aef7-cf50314f026b",\
       "string_text": "Example10", "string_miltilinetext": "Example10", "string_formattext": "Example10"}]' \
   https://dnt.iondv.com/rest/acceptor
```

Метод возвращает код `200` и массив сохраненных объектов.
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

В случае ошибки код ответа будет `400`, а текст ответа содержать 
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

#### Встроенный сервис "token"
Сервис `token` предназначен для выдачи токена пользователю, прошедшему аутентификацию, для его дальнейшего использования в сервисах 
осуществляющих аутентификацию по токену.

Сервис не требует регистрации в deploy.json. Сервис обеспечивает выдачу токена для авторизованного пользователя, 
если он имеет права `use` для ресурса `ws:::gen-ws-token`  или имеет права администратора. В ответ на запрос, возвращается 
токен вида `e444c69894d2087696e0a6c6914788f67ebcf6ee`. Время жизни токена по умолчанию 100 лет.

Пример запроса через аутентификацию типа basicAuth 
```bash
curl -u demo@local:ion-demo https://dnt.iondv.com/rest/token
```
 
Пример запроса  с аутентификацией через параметры в заголовке 
```bash
curl -H "auth-user: demo@local" -H "auth-pwd: ion-demo" -H "auth-user-type: local" https://dnt.iondv.com/rest/token
```

#### Встроенный сервис "crud"
Сервис `crud` реализует REST API по модели основных операций CRUD (create, read, update, delete).

Сервис требует регистрации в deploy.json приложения и требует обязательного указания источника данных `dataRepo` в `options` 
сервиса, а также источника авторизации `auth` для доступа к данным пользователя.
Целесооразно указывать в качестве репозитория данных - репозиторий с полной обработкой безопасности, чтобы отрабатывать 
доступ к объектам с учетом динамической безопаности. Например

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

Аутентификация осуществляется через все основные типы доступа, а по умолчанию через учетную запись пользователя.

Пример
```bash
curl -X POST -u demo@local:ion-demo https://dnt.iondv.com/rest/crud
```

По умолчанию, без правильных параметров - код ответа сервера `404` об ошибке
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

##### Получение списка объектов: метод GET crud/:class@namespace
Запрос списка объектов осуществляется методом `GET`, при этом указывается код класса и нейспейс, например `rest/crud/class_string@develop-and-test/`
```bash
curl -X GET -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/
```
В ответсервис выдает JSON Объект со смещением 0 и кол-вом 5ть записей и статусом `200`, если такого класса нет возвращает код `404`.

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

Запрос может быть осуществлен со следущими query параметрами:
* `_offset` - смещение выборки, по умолчанию 0
* `_count` - кол-во значение в выборке, по умолчанию 5
* `_eager` - список свойств класса, разделенных символом `|` для которых необходимо осуществить жадную загрузку данных.
* `[name of property]` - все параметры воспринимаютсяимя запроса, кроме начинающихся на `_` считаются именами атрибутов класса, 
а их значения задаются в качестве фильтров. 

Примеры:
```bash
# Запрос списка объектов класса со смещением 1 и кол-вом 2
curl -X GET -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/?_offset=1&_count=2
# Запрос списка объектов, у которы свойство string_text имеет значение example1
curl -X GET -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/?string_text=example1
# Запрос списка объектов, у которы свойство string_text имеет значение example1, со смещением 1 и кол-вом 2
curl -X GET -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/?string_text=example1&_offset=1&_count=2
```

##### Проверка наличия объекта: метод HEAD crud/:class@namespace/:id
Проверка наличия объекта осуществляется методом `HEAD`, при этом указывается код класса с нейспейсом и значение ключа объекта, 
например `rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b`

```bash
curl -X HEAD -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b
```

Если объект существует - возвращает код ответа `200`, если объект не найден `404`, если нет прав `403`.

##### Получение объекта: метод GET crud/:class@namespace/:id
Получение объекта осуществляется методом `GET`, при этом указывается код класса с нейспейсом и значение ключа объекта, 
например `rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b`

```bash
curl -X GET -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b
```

При этом дополнительно в query может быть задан параметр `_eager` содержащий список свойств класса, разделенных символом `|` 
для которых необходимо осуществить жадную загрузку данных (ссылки или коллекции). Например

```bash
curl -X GET -u demo@local:ion-demo https://dnt.iondv.com/rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b?_eager=string_text
```

Если объект существует - возвращает код ответа `200` и сам объект в формате json, если объект не найден `404`, если нет прав `403`.

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

##### Создание объекта: метод POST crud/:class@namespace
Создание объекта осуществляется методом `POST`, при этом указывается код класса с нейспейсом,
например `rest/crud/class_string@develop-and-test`. Сам объект передается в теле запроса в формате json с обязательным 
указанием в заголовке типа содержания json `Content-Type:application/json`. Автосоздаваемые поля указывать не обязательно. Пример

```bash
curl -X POST -u demo@local:ion-demo \
   -H "Content-Type:application/json" \
   -d '{"string_text": "Example3", "string_miltilinetext": "Example3", "string_formattext": "Example3"}' \
   https://dnt.iondv.com/rest/crud/class_string@develop-and-test/
```

В ответ будет возвращён созданный объект, в котором будут заполнены все автосозданные поля и указан код ответа `200`.
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

В случае ошибки код ответа будет `400`, а текст ответа содержать 
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

##### Обновление объекта: метод PATCH или PUT crud/:class@namespace/:id
Обновления объекта осуществляется методом `PATCH` или `PUT`, при этом указывается код класса с нейспейсом и значение ключа объекта, 
например `rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b`. Сам объект передается в теле
 запроса в формате json с обязательным указанием в заголовке типа содержания json `Content-Type:application/json`. 

Пример
```bash
curl -X PATCH -u demo@local:demo-ion -H "Content-Type:application/json" -d '{"string_text": "NEW Example", "string_miltilinetext": "NEW Example", "string_formattext": "NEW Example"}' https://dnt.iondv.com/rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b
# Или эквивалентно
curl -X PUT -u demo@local:demo-ion -H "Content-Type:application/json" -d '{"string_text": "NEW Example", "string_miltilinetext": "NEW Example", "string_formattext": "NEW Example"}' https://dnt.iondv.com/rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b
```


Если объект существует - возвращает код ответа `200` и сам объект в формате json, если объект не найден код `404`, при ошибке обработки код `500`, если нет прав `403`.

Пример объекта.
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

##### Удаление объекта: метод DELETE crud/:class@namespace/:id
Удаление объекта осуществляется методом `DELETE`, при этом указывается код класса с нейспейсом и значение ключа объекта, 
например `rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b`.

```bash
curl -X DELETE -u demo@local:demo-ion https://dnt.iondv.com/rest/crud/class_string@develop-and-test/66dbb3d0-5583-11e6-aef7-cf50314f026b
```

В случае успеха - сервис возвращает код ответа `200`, в случае если объект не найден `404`


### Создание сервиса
Создание собственного сервиса состоит из следующих действий:
* регистрация сервиса в deploy.json
* создание обработчика сервисв а приложении
* реализация логики обработки запросов

#### Регистрация сервиса в deploy.json приложения
Пример регистрации тестового сервиса, подробнее см. [Регистрация сервиса в конфигурации приложения](#регистрация-сервиса-в-конфигурации-приложения)
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

#### Разработка обработчика сервиса в приложении
Все сервисы реализуются как наследники от Service - функции модуля rest.

Какждый сервис должен экспортировать функцию обработчика, в которой реализован асинхронный метод `this._route`, в котором 
 необходимо зарегистрировать обрабатываемые методы и пути, через функции `this.addHandler` возвращающее Promise . Функция обработки
 будет иметь доступ к `options`, через который доступ к репозиториям данных, авторизации, метаданным и классам (если они 
 указаны в конфигурации приложения в файле deploy.json), а также получит объект с типовым названием `req` - являющимся 
 объектом `request` библиотеки [express](https://expressjs.com/en/4x/api.html#req).
 Уже распарсенные в объект данные будет находится в `req.body`.
 
Функция обработчик должна вернуть Promise разрешающееся в результат выполнения обработчика (для обработки в Service `modules/rest/lib/interfaces/Service.js`), 
 обработчик выдаст его с кодом 200 и типом содержания `Content-Type:application/json`. 
 Если в ходе обработки будет ошибка перехваченная catch то для
  ошибок связанных с контролем доступа будет возвращен ответ с тектом ошибки и с кодом `403`, а для всех остальных код ответа `500` 
  и сообщением об ошибке `Internal server error`. 
  
Заголовок можно переопределить, для этого в ответе нужно отдать тип заголовка `headers`, а объект в атрибуте `data`
```javascript
Promise.resolve({headers: ['Content-Type: image/png', 'Content-Length: 107'],
  data: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49,
          0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00,
          0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x06, 0x62, 0x4B, 0x47, 0x44, 0x00, 0xFF, 0x00, 0xFF,
          0x00, 0xFF, 0xA0, 0xBD, 0xA7, 0x93, 0x00, 0x00, 0x00, 0x09, 0x70, 0x48, 0x59, 0x73, 0x00, 0x00,
          0x2E, 0x23, 0x00, 0x00, 0x2E, 0x23, 0x01, 0x78, 0xA5, 0x3F, 0x76, 0x00, 0x00, 0x00, 0x0B, 0x49,
          0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0x60, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01, 0xE2, 0x26,
          0x05, 0x9B, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82])
})
```
 
Пример реализации сервиса выдающего списки объектов с фильтрами для класса `class_string` в приложении [develop-and-test].
Также для изучения удобно смотреть сам метод crud, находящийся по адресу `modules/rest/lib/impl/crud.js`

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

Запрос без атрибутов в теле запроса 
```bash
curl -X POST -u demo@local:ion-demo https://dnt.iondv.com:8888/rest/string-list
```

Вернет весь список
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

А запрос с параметром атрибута равного значению в атрибуте string_text 
`Example of the \"String [0]\" type in the \"Text [1]\" view`

```bash
curl -X POST -d "string_text=Example of the \"String [0]\" type in the \"Text [1]\"" \
     -u demo@local:ion-demo https://dnt.iondv.com:8888/rest/string-list
```

Вернет объекты удовлетворяющие условию
```json
[{"__class":"class_string@develop-and-test",
  "__classTitle":"Class \"String [0]\"",
  "id":"66dbb3d0-5583-11e6-aef7-cf50314f026b",
  "string_text":"Example of the \"String [0]\" type in the \"Text [1]\" view",
  "string_miltilinetext":"Example of the \"String [0]\"\r\n in the Multiline text [7] view",
  "string_formattext":"Example of the \r\n \"String [0]\" type \r\n in the \r\nFormatted text [7] view"}]
```

### Дополнительные сервисы

* [Метод SEARCH](/docs/ru/method_search.md)
* [Отправка запросов с файлами в CRUD сервисе](/docs/ru/methods_crud.md)
* [Сервис исполнения бизнес-процесса](/docs/ru/performance_workflow.md)
* [Cервис публикации метаданных](/docs/ru/service_metadata.md)
--------------------------------------------------------------------------  

 #### [Licence](/LICENSE) &ensp;  [Contact us](https://iondv.com/portal/contacts) &ensp;  [Russian](/docs/ru/readme.md)         

--------------------------------------------------------------------------  

Copyright (c) 2018 **LLC "ION DV"**.  
All rights reserved. 