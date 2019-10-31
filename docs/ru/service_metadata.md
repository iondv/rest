# Cервис публикации метаданных

Представляет собой встроенный сервис в rest модуле, который по сути отражает интерфейс метарепозитория. 

1. **Запросы** осуществляются через GET-методы. 
2. **Имена методов** метарепозитория задаются через путь.
3. **Идентификаторы мета-объектов** также через путь, вторым уровнем. 
4. **Дополнительные аргументы** - как query параметры.

Список GET-методов:
```
/getMeta/:name
/listMeta
/ancestor/:classname
/propertyMetas/:classname
/getNavigationSections
/getNavigationSection/:code
/getNode/:code
/getNodes/:section
/getListViewModel/:classname
/getCollectionViewModel/:classname
/getItemViewModel/:classname
/getCreationViewModel/:classname
/getDetailViewModel/:classname
/getWorkflows/:classname
/getWorkflowView/:classname/:workflow/:state
/getWorkflow/:classname/:workflow
/getMask/:name
/getValidators
```