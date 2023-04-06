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
    [{ count: 0 }, { count: { "__lt": 1 } }, true],
    [{ count: 2 }, { count: { "__lt": 1 } }, false],
    [{ count: 2 }, { count: { "__eq": 2 } }, true],
    [{ count: 2 }, { count: { "__neq": 2 } }, false],
    [{ count: 2 }, { count: { "__gt": 1, "__lt": 3 } }, true],
    [{ title: 'a' }, { title: { "__gt": 'b' } }, false],
    [{ title: 'c' }, { title: { "__gt": 'b' } }, true],
    [{ type: 'created' }, { type: { "__neq": 'created' } }, false],
    [{ type: 'created' }, { type: { "__eq": 'created' } }, true],
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
      { items: { inventory: { "__lte": 10 } } },
      true,
    ],
    [
      { items: [{ inventory: 12 }, { inventory: 11 }] },
      { items: { inventory: { "__lte": 10 } } },
      false,
    ],
    [{ tags: ['test', 'other', 'more'] }, { tags: ['test', 'other'] }, true],
    [
      { tags: ['test', 'other', 'more'] },
      { tags: ['test', 'whatever'] },
      false,
    ],
    [{ tags: ['test', 'other'] }, { tags: { "__eq": ['test', 'other'] } }, true],
    [
      { tags: ['test', 'other', 'more'] },
      { tags: { "__eq": ['test', 'other'] } },
      false,
    ],
    [[1, 2, 3], 3, true],
    [[1, 2, 3], 4, false],
    [[1, 2, 3], [{ "__eq": 3 }], true],
    [[1, 2, 3], [{ "__eq": 4 }], false],
    [[1, 2, 3], { "__eq": 3 }, false],
    [{ exist: true }, { exist: true }, true],
    [{ exist: true }, { exist: false }, false],
    [{ exist: null }, { exist: null }, true],
    [{ exist: null }, { exist: false }, false],
    [{ exist: null }, { exist: { "__eq": null } }, true],
    [{ exist: null }, { exist: { "__neq": null } }, false],
    ['created', 'created', true],
    [1, 2, false],
    [10, { "__gte": 5 }, true],
    [{ test: true }, true, false],
    [{ test: 'some-text' }, { test: { "__startsWith": 'some' } }, true],
    [{ test: 'some-text' }, { test: { "__endsWith": 'some' } }, false],
    [{ test: 'some-text' }, { test: { "__endsWith": 'text' } }, true],
    [{ test: 'some-text' }, { test: { something: 'text' } }, false],
    [{ test: { more: true } }, { test: { "__startsWith": 'text' } }, false],
    [
      { test: 'some-text', id: 123 },
      { test: { "__in": 'text' }, id: { "__in": [123, 456] } },
      true,
    ],
    [{ id: 123 }, { id: { "__in": [123, 456] } }, true],
    [{ id: 123 }, { id: { "__nin": [123, 456] } }, false],
    [{ test: 'some-text' }, { test: { "__in": 'text' } }, true],
    [{ test: 'some-text' }, { test: { "__nin": 'some' } }, false],
    [{ tags: ['test', 'something'] }, { tags: { "__nin": 'test' } }, false],
    [{ test: true, test2: true }, { test2: { "__ref": 'test' } }, true],
    [{ test: true, test2: false }, { test2: { "__ref": 'test' } }, false],
    [{ test: 1, test2: 2 }, { test2: { "__gt": { "__ref": 'test' } } }, true],
    [
      { types: ['something', 'else'], test2: 'else' },
      { types: { "__ref": 'test2' } },
      true,
    ],
    [
      { types: ['something', 'else'], test2: 'else' },
      { test2: { "__ref": 'types[1]' } },
      true,
    ],
    [
      { current: { something: true }, another: { thing: true } },
      { another: { thing: { "__ref": 'current.something' } } },
      true,
    ],
    [
      { current: { something: true }, another: { thing: true } },
      { another: { thing: { "__ref": { bad: 'ref' } } } },
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
            "__eq": { "__ref": 'test[__index].b' },
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
        "__or": [
          {
            test: {
              a: {
                "__eq": { "__ref": 'test[__index].b' },
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
            b: { "__ref": 'test[__index].a[__index].c' },
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
            b: { "__ref": 'test[__index].a[__index].c' },
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
          "__eq": { "__ref": '[__index].b' },
        },
      },
      true,
    ],
    [{ test: 1 }, { test: { "__gt": [1, 2, 3] } }, false],

    [{ test: true }, { "__or": [{ test: true }] }, true],
    [{ test: true }, { "__or": [{ test: false }] }, false],
    [
      { test: { something: 'else' } },
      { test: { "__or": [{ something: true }, { something: { "__in": 'else' } }] } },
      true,
    ],
    [
      { test: { something: 'else' } },
      { test: { "__or": [{ something: true }, { something: { "__in": 'no' } }] } },
      false,
    ],
    [1, { "__or": [1, 2] }, true],
    [1, { "__or": [2, 3] }, false],
    [{ test: true }, { "__and": [{ test: true }] }, true],
    [{ test: true }, { "__or": [{ test: false }] }, false],
    [
      { test: { something: 'else' } },
      {
        test: {
          "__and": [{ something: { "__neq": null } }, { something: { "__in": 'else' } }],
        },
      },
      true,
    ],
    [
      { test: { something: null } },
      {
        test: {
          "__and": [{ something: { "__neq": null } }, { something: { "__in": 'else' } }],
        },
      },
      false,
    ],
    [1, { "__and": [1, 2] }, false],
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
          "__and": [
            {
              a: {
                "__neq": null,
              },
            },
            {
              a: {
                "__neq": { "__ref": 'previous.a' },
              },
            },
          ],
        },
      },
      true,
    ],
    [{ test: 'else' }, { test: { "__exist": true } }, true],
    [{ test: 'else' }, { test: { "__exist": false } }, false],
    [{ test1: 'else' }, { test: { "__exist": true } }, false],
    [{ test1: 'else' }, { test: { "__exist": false } }, true],
    ['/test', '/test', true],
    ['/test', '/test2', false],
    [1, 1, true],
    [1, 2, false],
    [1, {}, false],
    [
      { test: { test1: 'else' } },
      { test: { test1: { "__exist": true, "__or": ['else', 'not'] } } },
      true,
    ],
    [
      { test: { test1: 'else1' } },
      { test: { test1: { "__exist": true, "__or": ['else', 'not'] } } },
      false,
    ],
    [
      { test: { test1: 'else' } },
      { test: { test1: { "__exist": true, "__in": 'el' } } },
      true,
    ],
    [
      { test: { test1: 'else' } },
      { test: { test1: { "__exist": true, "__in": 'no' } } },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        test: {
          test1: { "__exist": true, "__or": ['else', 'not'] },
          "__and": [{ test1: 'else' }, { test2: 'not' }],
        },
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        test: {
          test1: { "__exist": true, "__or": ['else1', 'not1'] },
          "__and": [{ test1: 'else1' }, { test2: 'not1' }],
        },
      },
      false,
    ],
    [
      { test: { test1: { test2: 'else' } } },
      { test: { test1: { test2: { "__exist": true } } } },
      true,
    ],
    [
      { test: { test1: { test2: 'else' } } },
      { test: { test1: { test2: { "__exist": false } } } },
      false,
    ],
    [
      { test: { test1: { test3: 'else' } } },
      { test: { test1: { test2: { "__exist": false } } } },
      true,
    ],
    [
      { test: { test1: { test3: 'else' } } },
      { test: { test1: { test2: { "__exist": true } } } },
      false,
    ],
    [
      { test: { test1: 'else' } },
      {
        "__or": [
          { test: { test1: { "__exist": true } } },
          { test: { test1: 'else1' } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else' } },
      {
        "__or": [
          { test: { test1: { "__exist": false } } },
          { test: { test1: 'else' } },
        ],
      },
      true,
    ],
    [
      { test: { test2: 'else' } },
      {
        "__or": [
          { test: { test1: { "__exist": true } } },
          { test: { test2: 'else' } },
        ],
      },
      true,
    ],
    [
      { test: { test2: 'else' } },
      {
        "__or": [
          { test: { test1: { "__exist": true } } },
          { test: { test2: 'else1' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__or": [
          { test: { test1: { "__exist": true } } },
          { test: { test2: 'else1' } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__and": [
          { test: { test1: { "__exist": true } } },
          { test: { test2: 'not' } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__and": [
          { test: { test1: { "__exist": true } } },
          { test: { test2: 'not1' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__and": [
          { test: { test1: { "__exist": true } } },
          { test: { test1: 'else' } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__and": [
          { test: { test1: { "__exist": true } } },
          { test: { test1: 'else1' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__and": [{ test: { test1: { "__exist": true, "__eq": 'else' } } }],
      },
      true,
    ],
    [
      { test: { test2: 'not' } },
      {
        "__and": [{ test: { test1: { "__exist": true, "__eq": 'not' } } }],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__and": [
          { test: { test1: { "__exist": true } } },
          { test: { test2: { "__exist": true } } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__and": [
          { test: { test1: { "__exist": true } } },
          { test: { test2: { "__exist": false } } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else' } },
      {
        "__and": [
          { test: { test1: { "__exist": true } } },
          { test: { test2: { "__exist": false } } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else' } },
      {
        "__or": [
          { test: { test1: { "__exist": true } } },
          { test: { test2: { "__exist": false } } },
        ],
      },
      true,
    ],
    [
      { test: { test3: 'else' } },
      {
        "__or": [
          { test: { test1: { "__exist": true } } },
          { test: { test2: { "__exist": false } } },
        ],
      },
      true,
    ],
  ];

  const not_tests = [
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__not": {
          test: { test1: 'else2' },
        },
        "__and": [{ test: { test1: 'else' } }, { test: { test2: 'not' } }],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__not": {
          test: { test1: 'else' },
        },
        "__and": [{ test: { test1: 'else' } }, { test: { test2: 'not' } }],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__not": {
          test: { test1: { "__exist": true } },
        },
        "__and": [{ test: { test1: 'else' } }, { test: { test2: 'not' } }],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__not": {
          test: { test1: { "__exist": false } },
        },
        "__and": [{ test: { test1: 'else' } }, { test: { test2: 'not' } }],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__not": {
          test: { test1: { "__exist": false } },
        },
        "__and": [
          { test: { test3: { "__exist": false } } },
          { test: { test2: 'not' } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__not": {
          test: { test1: { "__exist": false } },
        },
        "__and": [
          { test: { test3: { "__exist": true } } },
          { test: { test2: 'not' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__not": {
          test: { test1: 'else2' },
        },
        "__or": [
          { test: { test3: { "__exist": true } } },
          { test: { test2: 'not' } },
        ],
      },
      true,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__not": {
          test: { test1: 'else' },
        },
        "__or": [
          { test: { test3: { "__exist": true } } },
          { test: { test2: 'not' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__not": {
          test: { test1: 'else' },
        },
        "__or": [
          { test: { test3: { "__exist": false } } },
          { test: { test2: 'not' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__not": {
          test: { test1: 'else' },
        },
        "__or": [
          { test: { test3: { "__exist": false } } },
          { test: { test2: 'not2' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__not": {
          test: { test1: 'else2' },
        },
        "__or": [
          { test: { test3: { "__exist": true } } },
          { test: { test2: 'not2' } },
        ],
      },
      false,
    ],
    [
      { test: { test1: 'else', test2: 'not' } },
      {
        "__not": {
          test: { test1: 'else2' },
        },
        "__or": [
          { test: { test3: { "__exist": false } } },
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
      "__not": schema,
    })} expect ${!match}`, async () => {
      expect(matchJsonToSchema(input as any, { "__not": schema } as any)).toBe(
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
