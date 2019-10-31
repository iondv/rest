# Metadata publishing service

It is a built-in service in the rest module, which essentially reflects the meta repository interface.

1. **Request** - implemented through GET methods. 
2. **Method names** - meta repositories are set through the path.
3. **Meta object identifiers** - also across the path, second level.
4. **Additional arguments** - as query parameters.

List of GET-methods:
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