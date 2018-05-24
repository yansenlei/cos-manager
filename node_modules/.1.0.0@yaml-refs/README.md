# Read YAML files with refs

minuscule wrapper of [json-refs](https://github.com/whitlockjc/json-refs) that works with YAML

### Usage
```
yamlRefs(filepath).then((parsedObject) => {
  console.log(parsedObject.propertyFoo);
  ...
}
```
