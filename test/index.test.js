'use strict';

const resolveFields = require('..');

describe('resolver', () => {
  it('resolves a field', () => {
    const resolver = {
      a: 1,
    };
    return expect(resolveFields(resolver, ['a'])).to.eventually.eql({ a: 1 });
  });

  it('resolves only one field', () => {
    const resolver = {
      a: 1,
      b: 2,
      c: 3,
    };
    return expect(resolveFields(resolver, ['b'])).to.eventually.eql({ b: 2 });
  });

  it('resolves thunk', () => {
    const resolver = {
      a: 1,
      b: () => 2,
      c: 3,
    };
    return expect(resolveFields(resolver, ['b'])).to.eventually.eql({ b: 2 });
  });

  it('resolves promise thunks', () => {
    const resolver = {
      a: () => Promise.resolve(1),
      b: () => Promise.resolve(2),
      c: () => Promise.resolve(3),
    };
    return expect(resolveFields(resolver, ['a', 'b', 'c'])).to.eventually.eql({ a: 1, b: 2, c: 3 });
  });

  describe('nested', () => {
    it('resolves a field', () => {
      const resolver = {
        user: {
          name: 'john',
          age: 35,
        }
      };

      return expect(resolveFields(resolver, [{
        name: 'user',
        include: ['name']
      }])).to.eventually.eql({
        user: {
          name: 'john'
        }
      })
    });

    it('resolves fields', () => {
      const resolver = {
        user: {
          name: 'john',
          age: 35,
        }
      };

      return expect(resolveFields(resolver, [{
        name: 'user',
        include: ['name', 'age']
      }])).to.eventually.eql({
        user: {
          name: 'john',
          age: 35,
        }
      })
    });

    it('resolves thunks', () => {
      const resolver = {
        user: {
          name: () => 'john',
          age: () => 35,
        }
      };

      return expect(resolveFields(resolver, [{
        name: 'user',
        include: ['name', 'age']
      }])).to.eventually.eql({
        user: {
          name: 'john',
          age: 35
        },
      })
    });

    it('resolves a promise thunk', () => {
      const resolver = {
        user: {
          name: () => Promise.resolve('john'),
          age: () => Promise.resolve(35),
        }
      };

      return expect(resolveFields(resolver, [{
        name: 'user',
        include: ['name', 'age']
      }])).to.eventually.eql({
        user: {
          name: 'john',
          age: 35
        }
      })
    });

    it('resolves a promise with resolver', () => {
      const resolver = {
        user: () => Promise.resolve({
          name: 'john',
          age: 35,
        }),
      };

      return expect(resolveFields(resolver, [{
        name: 'user',
        include: ['name', 'age']
      }])).to.eventually.eql({
        user: {
          name: 'john',
          age: 35,
        }
      })
    })
  });
});