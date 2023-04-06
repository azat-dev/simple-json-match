import matchJsonToSchema from '../index';

describe('matchJsonToSchema.test.ts', () => {
  const tests = [
    [{ type: 'created' }, { type: 'created' }, true],
    [{}, { type: 'created' }, false],
    [{ type: 'updated' }, { type: 'created' }, false],
    [{ type: 1 }, { type: 'created' }, false],
    [{ type: 1 }, { type: 1 }, true],
    [{ count: 1, type: 'created' }, { count: 1 }, true],
    [{ count: 1, type: 'created' }, { count: 1, type: 'created' }, true],
    [{ count: 1 }, { count: 1, type: 'created' }, false],
    [{ count: 0 }, { count: { "_$lt": 1 } }, true],
    [{ count: 2 }, { count: { "_$lt": 1 } }, false],
    [{ count: 2 }, { count: { "_$eq": 2 } }, true],
    [{ count: 2 }, { count: { "_$neq": 2 } }, false],
    [{ count: 2 }, { count: { "_$gt": 1, "_$lt": 3 } }, true],
    [{ title: 'a' }, { title: { "_$gt": 'b' } }, false],
    [{ title: 'c' }, { title: { "_$gt": 'b' } }, true],
    [{ type: 'created' }, { type: { "_$neq": 'created' } }, false],
    [{ type: 'created' }, { type: { "_$eq": 'created' } }, true],
    [
      { type: { something: 'created' } },
      { type: { something: 'created' } },
      true,
    ],
    [
      { type: { something: 'created' } },
      { type: { something: 'updated' } },
      false,
    ],
    [{ type: { something: 'created' } }, { type: 1 }, false],
    [{ tags: ['test', 'other'] }, { tags: 'test' }, true],
    [{ tags: ['test', 'other'] }, { tags: 'nope' }, false],
    [{ items: [{ sku: 'test' }] }, { items: { sku: 'test' } }, true],
    [{ items: [{ sku: 'test' }] }, { items: { sku: '1' } }, false],
    [
      { items: [{ inventory: 9 }, { inventory: 11 }] },
      { items: { inventory: { "_$lte": 10 } } },
      true,
    ],
    [
      { items: [{ inventory: 12 }, { inventory: 11 }] },
      { items: { inventory: { "_$lte": 10 } } },
      false,
    ],
    [{ tags: ['test', 'other', 'more'] }, { tags: ['test', 'other'] }, true],
    [
      { tags: ['test', 'other', 'more'] },
      { tags: ['test', 'whatever'] },
      false,
    ],
    [{ tags: ['test', 'other'] }, { tags: { "_$eq": ['test', 'other'] } }, true],
    [
      { tags: ['test', 'other', 'more'] },
      { tags: { "_$eq": ['test', 'other'] } },
      false,
    ],
    [[1, 2, 3], 3, true],
    [[1, 2, 3], 4, false],
    [[1, 2, 3], [{ "_$eq": 3 }], true],
    [[1, 2, 3], [{ "_$eq": 4 }], false],
    [[1, 2, 3], { "_$eq": 3 }, false],
    [{ exist: true }, { exist: true }, true],
    [{ exist: true }, { exist: false }, false],
    [{ exist: null }, { exist: null }, true],
    [{ exist: null }, { exist: false }, false],
    [{ exist: null }, { exist: { "_$eq": null } }, true],
    [{ exist: null }, { exist: { "_$neq": null } }, false],
    ['created', 'created', true],
    [1, 2, false],
    [10, { "_$gte": 5 }, true],
    [{ test: true }, true, false],
    [{ test: 'some-text' }, { test: { "_$startsWith": 'some' } }, true],
    [{ test: 'some-text' }, { test: { "_$endsWith": 'some' } }, false],
    [{ test: 'some-text' }, { test: { "_$endsWith": 'text' } }, true],
    [{ test: 'some-text' }, { test: { something: 'text' } }, false],
    [{ test: { more: true } }, { test: { "_$startsWith": 'text' } }, false],
    [
      { test: 'some-text', id: 123 },
      { test: { "_$in": 'text' }, id: { "_$in": [123, 456] } },
      true,
    ],
    [{ id: 123 }, { id: { "_$in": [123, 456] } }, true],
    [{ id: 123 }, { id: { "_$nin": [123, 456] } }, false],
    [{ test: 'some-text' }, { test: { "_$in": 'text' } }, true],
    [{ test: 'some-text' }, { test: { "_$nin": 'some' } }, false],
    [{ tags: ['test', 'something'] }, { tags: { "_$nin": 'test' } }, false],
    [{ test: true, test2: true }, { test2: { "_$ref": 'test' } }, true],
    [{ test: true, test2: false }, { test2: { "_$ref": 'test' } }, false],
    [{ test: 1, test2: 2 }, { test2: { "_$gt": { "_$ref": 'test' } } }, true],
    [
      { types: ['something', 'else'], test2: 'else' },
      { types: { "_$ref": 'test2' } },
      true,
    ],
    [
      { types: ['something', 'else'], test2: 'else' },
      { test2: { "_$ref": 'types[1]' } },
      true,
    ],
    [
      { current: { something: true }, another: { thing: true } },
      { another: { thing: { "_$ref": 'current.something' } } },
      true,
    ],
    [
      { current: { something: true }, another: { thing: true } },
      { another: { thing: { "_$ref": { bad: 'ref' } } } },
      false,
    ],
    [
      {
        test: [
          { a: 2, b: 1 },
          { a: 2, b: 2 },
        ],
      },
      {
        test: {
          a: {
            "_$eq": { "_$ref": 'test[_$index].b' },
          },
        },
      },
      true,
    ],
    [
      {
        test: [
          { a: 2, b: 1 },
          { a: 2, b: 2 },
        ],
      },
      {
        "_$or": [
          {
            test: {
              a: {
                "_$eq": { "_$ref": 'test[_$index].b' },
              },
            },
          },
        ],
      },
      true,
    ],
    [
      {
        test: [{ a: [{ b: 3, c: 3 }] }, { a: [{ b: 2, c: 3 }] }],
      },
      {
        test: {
          a: {
            b: { "_$ref": 'test[_$index].a[_$index].c' },
          },
        },
      },
      true,
    ],
    [
      {
        test: [{ a: [{ b: 3, c: 4 }] }, { a: [{ b: 2, c: 3 }] }],
      },
      {
        test: {
          a: {
            b: { "_$ref": 'test[_$index].a[_$index].c' },
          },
        },
      },
      false,
    ],
    [
      [
        { a: 2, b: 1 },
        { a: 2, b: 2 },
      ],
      {
        a: {
          "_$eq": { "_$ref": '[_$index].b' },
        },
      },
      true,
    ],
    [{ test: 1 }, { test: { "_$gt": [1, 2, 3] } }, false],

    [{ test: true }, { "_$or": [{ test: true }] }, true],
    [{ test: true }, { "_$or": [{ test: false }] }, false],
    [
      { test: { something: 'else' } },
      { test: { "_$or": [{ something: true }, { something: { "_$in": 'else' } }] } },
      true,
    ],
    [
      { test: { something: 'else' } },
      { test: { "_$or": [{ something: true }, { something: { "_$in": 'no' } }] } },
      false,
    ],
    [1, { "_$or": [1, 2] }, true],
    [1, { "_$or": [2, 3] }, false],
    [{ test: true }, { "_$and": [{ test: true }] }, true],
    [{ test: true }, { "_$or": [{ test: false }] }, false],
    [
      { test: { something: 'else' } },
      {
        test: {
          "_$and": [{ something: { "_$neq": null } }, { something: { "_$in": 'else' } }],
        },
      },
      true,
    ],
    [
      { test: { something: null } },
      {
        test: {
          "_$and": [{ something: { "_$neq": null } }, { something: { "_$in": 'else' } }],
        },
      },
      false,
    ],
    [1, { "_$and": [1, 2] }, false],
    [
      {
        current: {
          a: 'a',
        },
        previous: {
          a: 'test',
        },
      },
      {
        current: {
          "_$and": [
            {
              a: {
                "_$neq": null,
              },
            },
            {
              a: {
                "_$neq": { "_$ref": 'previous.a' },
              },
            },
          ],
        },
      },
      true,
    ],
    [{ test: 'else' }, { test: { "_$exist": true } }, true],
    [{ test: 'else' }, { test: { "_$exist": false } }, false],
    [{ test1: 'else' }, { test: { "_$exist": true } }, false],
    [{ test1: 'else' }, { test: { "_$exist": false } }, true],
    ['/test', '/test', true],
    ['/test', '/test2', false],
    [1, 1, true],
    [1, 2, false],
    [1, {}, false],
    [
      { test: { test1: 'else' } },
      { test: { test1: { "_$exist": true, "_$or": ['else', 'not'] } } },
      true,
    ],
    [
      { test: { test1: 'else1' } },
      { test: { test1: { "_$exist": true, "_$or": ['else', 'not'] } } },
      false,
    ],
    [
      { test: { test1: 'else' } },
      { test: { test1: { "_$exist": true, "_$in": 'el' } } },
      true,
    ],
    [
      { test: { test1: 'else' } },
      { test: { test1: { "_$exist": true, "_$in": 'no' } } },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        test: {
          test1: { "_$exist": true, "_$or": ['else', 'not'] },
          "_$and": [{ test1: 'else' }, { test2: 'not' }],
        },
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        test: {
          test1: { "_$exist": true, "_$or": ['else1', 'not1'] },
          "_$and": [{ test1: 'else1' }, { test2: 'not1' }],
        },
      },
      false,
    ],
    [
      { test: { test1: { test2: 'else' } } },
      { test: { test1: { test2: { "_$exist": true } } } },
      true,
    ],
    [
      { test: { test1: { test2: 'else' } } },
      { test: { test1: { test2: { "_$exist": false } } } },
      false,
    ],
    [
      { test: { test1: { test3: 'else' } } },
      { test: { test1: { test2: { "_$exist": false } } } },
      true,
    ],
    [
      { test: { test1: { test3: 'else' } } },
      { test: { test1: { test2: { "_$exist": true } } } },
      false,
    ],
    [
      { test: { test1: 'else' } },
      {
        "_$or": [
          { test: { test1: { "_$exist": true } } },
          { test: { test1: 'else1' } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else' } },
      {
        "_$or": [
          { test: { test1: { "_$exist": false } } },
          { test: { test1: 'else' } },
        ],
      },
      true,
    ],
    [
      { test: { test2: 'else' } },
      {
        "_$or": [
          { test: { test1: { "_$exist": true } } },
          { test: { test2: 'else' } },
        ],
      },
      true,
    ],
    [
      { test: { test2: 'else' } },
      {
        "_$or": [
          { test: { test1: { "_$exist": true } } },
          { test: { test2: 'else1' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$or": [
          { test: { test1: { "_$exist": true } } },
          { test: { test2: 'else1' } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$and": [
          { test: { test1: { "_$exist": true } } },
          { test: { test2: 'not' } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$and": [
          { test: { test1: { "_$exist": true } } },
          { test: { test2: 'not1' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$and": [
          { test: { test1: { "_$exist": true } } },
          { test: { test1: 'else' } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$and": [
          { test: { test1: { "_$exist": true } } },
          { test: { test1: 'else1' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$and": [{ test: { test1: { "_$exist": true, "_$eq": 'else' } } }],
      },
      true,
    ],
    [
      { test: { test2: 'not' } },
      {
        "_$and": [{ test: { test1: { "_$exist": true, "_$eq": 'not' } } }],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$and": [
          { test: { test1: { "_$exist": true } } },
          { test: { test2: { "_$exist": true } } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$and": [
          { test: { test1: { "_$exist": true } } },
          { test: { test2: { "_$exist": false } } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else' } },
      {
        "_$and": [
          { test: { test1: { "_$exist": true } } },
          { test: { test2: { "_$exist": false } } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else' } },
      {
        "_$or": [
          { test: { test1: { "_$exist": true } } },
          { test: { test2: { "_$exist": false } } },
        ],
      },
      true,
    ],
    [
      { test: { test3: 'else' } },
      {
        "_$or": [
          { test: { test1: { "_$exist": true } } },
          { test: { test2: { "_$exist": false } } },
        ],
      },
      true,
    ],
  ];

  const not_tests = [
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$not": {
          test: { test1: 'else2' },
        },
        "_$and": [{ test: { test1: 'else' } }, { test: { test2: 'not' } }],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$not": {
          test: { test1: 'else' },
        },
        "_$and": [{ test: { test1: 'else' } }, { test: { test2: 'not' } }],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$not": {
          test: { test1: { "_$exist": true } },
        },
        "_$and": [{ test: { test1: 'else' } }, { test: { test2: 'not' } }],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$not": {
          test: { test1: { "_$exist": false } },
        },
        "_$and": [{ test: { test1: 'else' } }, { test: { test2: 'not' } }],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$not": {
          test: { test1: { "_$exist": false } },
        },
        "_$and": [
          { test: { test3: { "_$exist": false } } },
          { test: { test2: 'not' } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$not": {
          test: { test1: { "_$exist": false } },
        },
        "_$and": [
          { test: { test3: { "_$exist": true } } },
          { test: { test2: 'not' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$not": {
          test: { test1: 'else2' },
        },
        "_$or": [
          { test: { test3: { "_$exist": true } } },
          { test: { test2: 'not' } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$not": {
          test: { test1: 'else' },
        },
        "_$or": [
          { test: { test3: { "_$exist": true } } },
          { test: { test2: 'not' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$not": {
          test: { test1: 'else' },
        },
        "_$or": [
          { test: { test3: { "_$exist": false } } },
          { test: { test2: 'not' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$not": {
          test: { test1: 'else' },
        },
        "_$or": [
          { test: { test3: { "_$exist": false } } },
          { test: { test2: 'not2' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$not": {
          test: { test1: 'else2' },
        },
        "_$or": [
          { test: { test3: { "_$exist": true } } },
          { test: { test2: 'not2' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "_$not": {
          test: { test1: 'else2' },
        },
        "_$or": [
          { test: { test3: { "_$exist": false } } },
          { test: { test2: 'not' } },
        ],
      },
      true,
    ],
  ];

  tests.forEach(([input, schema, match]) => {
    it(`Correctly matches ${JSON.stringify(input)} with ${JSON.stringify(
      schema
    )} expect ${match}`, async () => {
      expect(matchJsonToSchema(input as any, schema as any)).toBe(match);
    });

    it(`Correctly matches ${JSON.stringify(input)} with ${JSON.stringify({
      "_$not": schema,
    })} expect ${!match}`, async () => {
      expect(matchJsonToSchema(input as any, { "_$not": schema } as any)).toBe(
        !match
      );
    });
  });

  not_tests.forEach(([input, schema, match]) => {
    it(`Correctly matches ${JSON.stringify(input)} with ${JSON.stringify(
      schema
    )} expect ${match}`, async () => {
      expect(matchJsonToSchema(input as any, schema as any)).toBe(match);
    });
  });
});
