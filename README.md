# graphql-like schemaless object resolver

```js
const resolver = {
  a: {
    b: function () {
      return Promise.resolve({
        c: function() {
          return Promise.resolve(42);
        },
      });
    }
  },
};

const resolveObject = require('.');
const assert = require('assert');

resolveObject(resolver, [
  {
    name: 'a',
    include: [
      {
        name: 'b',
        include: [ 'c' ]
      }
    ]
  }
]).then(obj => assert.deepEqual(obj, {
  a: {
    b: {
      c: 42
    },
  },
}));
```

More: [examples](https://github.com/tomazy/resolve-object/blob/master/test/examples.js).
