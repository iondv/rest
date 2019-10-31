# Work-flow execution service

## Service principle

The service maps for all methods to one path of the form `/:class/:id` to identify the data object.

The service contains three methods:
* `GET` - without parameters, returns information about the current status in the work-flow (possible transitions)
* `PUT` - transfers the object to the indicated **next** stages of different work-flows. 
* `PATCH` - performs a forced transfer of the object to the indicated stages of different work-flows.

## Method specification:

### GET-method
Getting the current state of the object in the work-flow:
```
'/:class/:id', 'GET'
``` 

### The PUT method

Transitions of an object by work-flow (including sequential):
```
'/:class/:id', 'PUT' 
{
  "workflow1@namespace": [
    "transiton1", // first transition
    "transition2" // second transition
  ],
  "workflow2@namespace": [
    "transition1",
    "transition2"
  ]
}
```
For the **PUT**, pass one of the options in the request body:
* transition arrays;
* an object whose attributes are work-flow names, and attribute values are transition arrays.

In the **PUT** method, we sequentially conduct an object for the indicated transitions of the work-flow. If an error occurs during the transition, we fix it in order to return it in the response, and perform the next transition.

### The PATCH method

Forced movement of an object to the specified work-flow states:
```
'/:class/:id', 'PATCH' 
["workflow1@namespace.state1", "workflow2@namespace.state2"]
```
For the **PATCH** method, we pass in the request body an array of states of different work-flows. We sequentially place the object in each of the transferred states.


## Example

Request (GET-method):
```
curl -X GET -u demo@local:ion-demo http://dnt.iondv.com/rest/crud/workflowBase@develop-and-test/1
```

Response:
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