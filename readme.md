# simple-json-match

[slack-badge]: https://img.shields.io/badge/Slack-Hookdeck%20Developers-blue?logo=slack

[![slack-badge]](https://join.slack.com/t/hookdeckdevelopers/shared_invite/zt-yw7hlyzp-EQuO3QvdiBlH9Tz2KZg5MQ)

`simple-json-match` library to evaluate match a JSON document values with a simple syntax.

It was designed to be used within [hookdeck.com](https://hookdeck.com) filtering engine and provides for a simple method for users to input their desired filter.

This is not a full schema validation library like `json-schema` instead its goal is to provide a simple straitforward syntax to evalute match between values rather then type.

# Install

```
npm install simple-json-match
```

```
yarn add simple-json-match
```

Typescript definitions are provided within the package.

# Getting Started

`simple-match-json` exports a single method to evaluate the match between a JSON document and the input schema.

```js
import matchJSONToSchema from 'simple-json-match';

const product = {
  id: 123,
  title: 'A product',
};

const schema = {
  id: 123,
};

matchJSONToSchema(product, schema); // true
```

# Supported Types

matchJSONToSchema supports raw `string` `boolean` `number` or `null` and the library Schema JSON syntax.

```js
matchJSONToSchema(true, true); // true
```

```js
matchJSONToSchema(true, false); // false
```

```js
matchJSONToSchema({ test: true }, { test: false }); // false
```

# Schema Syntax

JSON filter supports matching on any value (`string` `number` `boolean` `null`), on nested objects and on arrays.

### Simple primitives

Simple primitive are `string`, `number`, `boolean` or `null` that will be matched if equal.

```js
const product = {
  type: 'order/created',
  order: {
    id: 123,
  },
};

const schema = {
  type: 'order/created',
};

matchJSONToSchema(product, schema); // true
```

### Nested Objects

Just like normal JSON, objects can be nested

```js
const product = {
  product: {
    title: 'A product',
    inventory: 0,
  },
};

const schema = {
  product: {
    inventory: 0,
  },
};

matchJSONToSchema(product, schema); // true
```

### Arrays

Arrays are always matched partially. It's effectively the same as `contains`

```js
const product = {
  product: {
    title: 'Gift Card',
    tags: ['gift', 'something'],
  },
};

const schema = {
  product: {
    tags: 'gift',
  },
};

matchJSONToSchema(product, schema); // true
```

You can also match multiple items (they must all be contained)

```js
const product = {
  product: {
    title: 'Gift Card',
    tags: ['gift', 'something', 'another'],
  },
};

const schema = {
  product: {
    tags: ['gift', 'something'],
  },
};

matchJSONToSchema(product, schema); // true
```

Or even nested objects

```js
const order = {
  order: {
    id: 123,
    items: [
      {
        id: 456,
        title: 'My product',
      },
    ],
  },
};

const schema = {
  order: {
    items: {
      id: 456,
    },
  },
};

matchJSONToSchema(order, schema); // true
```

### Operators

Sometimes you need more than simple a `equal` matching. Our syntax support different operators to allow for more complex matching strategies.

Operators can be used as an object instead of the matching primitive (value)

```js
const product = {
  product: {
    title: 'A product',
    inventory: 5,
  },
};

const schema = {
  product: {
    inventory: {
      "__lte": 10,
    },
  },
};

matchJSONToSchema(product, schema); // true
```

#### All operators

| Operator    | Supported Type    | Description                   |
| ----------- | ----------------- | ----------------------------- |
| __eq         | `any`             | Equal (or deep equal)         |
| __neq        | `any`             | Not Equal (or deep not equal) |
| __in         | `string`,`array`  | Contains                      |
| __nin        | `string`,`array`  | Does not contain              |
| __gte        | `string`,`number` | Greater than or equal to      |
| __gt         | `string`,`number` | Greater than                  |
| __lte        | `string`,`number` | Less than or equal to         |
| __lt         | `string`,`number` | Less than                     |
| __startsWith | `string`          | Starts with text              |
| __endsWith   | `string`          | Ends with text                |
| __or         | `array`           | Array of conditions to match  |
| __and        | `array`           | Array of conditions to match  |
| __ref        | &lt;field&gt;     | Reference a field             |
| __exist      | boolean           | Undefined or not undefined    |
| __not        | Valid syntax      | Negation                      |

### __or / __and Operator

The reference `__or` and `__and` are special operator to evaluate match with an array of conditions. For the match to be true, only one of the condition needs to match. The array of condition can contain any other valid schema supported.

```js
const product = {
  product: {
    title: 'A product',
    inventory: 5,
  },
};

const schema = {
  product: {
    inventory: {
      "__or": [1, 5],
    },
  },
};

matchJSONToSchema(product, schema); // true
```

```js
const exmaple = {
  "hello": "world"
}

const schema = {
  "__or": [
    {  "hello": "johny"}
    {  "hello": "mark"},
  ]
}

matchJSONToSchema(example, schema); // false

```

### References

The refrence `__ref` is a special operator to reference other values in your JSON input when evaluating match. The reference input must be a `string` representing the value path. For example using this JSON input:

```js
const example = {
  type: 'example',
  nested_object: {
    hello: 'world'
    array: [1, 2, 3]
  }
};

const ref1 = 'type' // example
const ref2 = 'type.nested_object.hello' // world
const ref3 = 'type.nested_object.array[1]' // 1
const ref3 = 'type.nested_object.array[__index]' // 1,2 or 3 depending on the current index
```

```js
const product = {
  updated_at: '2020-04-20',
  created_at: '2020-04-20',
};

const schema = {
  updated_at: {
    "__ref": 'created_at',
  },
};

matchJSONToSchema(product, schema); // true
```

You can also reference the current array index instead of a specific index with `__index`. You can have multiple `__index` in your reference if you are dealing with nested arrays.

```js
const input = {
  variants: [
    { updated_at: '2020-05-20', created_at: '2020-04-20' },
    { updated_at: '2020-04-20', created_at: '2020-04-20' },
  ],
};

const schema = {
  variants: {
    updated_at: {
      "__ref": 'variants[__index].created_at',
    },
  },
};

matchJSONToSchema(product, schema); // true
```

A reference can also be used in conjuction with other operators

```js
const product = {
  inventory: 0,
  old_inventory: 10,
};

const schema = {
  inventory: {
    "__lte": { "__ref": 'old_inventory' },
  },
};

matchJSONToSchema(product, schema); // true
```

### __exist operator

`__exist` requires a field to be undefined when false and array, number, object, string, boolean or null when true.

```js
const product = {
  inventory: 0,
};

const schema = {
  old_inventory: {
    "__exist": false,
  },
};
```

### Negation operator

`__not` negation of the schema.

```js
const product = {
  inventory: 0,
};

const schema = {
  "__not": {
    inventory: 1,
  },
};
```
