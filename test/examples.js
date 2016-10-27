'use strict';

const resolveObject = require('..');
const example = it;

const db = {
  persons: {
    '1001': {
      name: 'john',
      age: 20,
      friends: [1002, 1003],
      messages: [2001, 2003],
    },
    '1002': {
      name: 'alice',
      age: 21,
      friends: [1001],
      messages: [2002],
    },
    '1003': {
      name: 'bob',
      age: 22,
      friends: [1001],
      messages: [2004],
    }
  },
  messages: {
    '2001': {
      createdAt: 1477515401936,
      content: 'Message 1',
    },
    '2002': {
      createdAt: 1477515402936,
      content: 'Message 2',
    },
    '2003': {
      createdAt: 1477515403936,
      content: 'Message 3',
    },
    '2004': {
      createdAt: 1477515404936,
      content: 'Message 4',
    },
  }
};

const api = {
  fetchPerson(id) {
    return Promise.resolve(db.persons[id]);
  },

  fetchPersons() {
    return Promise.resolve(
      Object.keys(db.persons).map(id => db.persons[id])
    );
  },

  fetchMessage(id) {
    return Promise.resolve(db.messages[id]);
  },
};

function personResolver(root, person) {
  return Object.assign({}, person, {
    friends() {
      return person.friends.map(id => root.person({ id }));
    },

    messages() {
      return person.messages.map(id => root.message({ id }));
    }
  });
}

function messageResolver(message) {
  return Object.assign({}, message);
}

function rootResolver(api) {
  const resolver = {
    person(args) {
      return api.fetchPerson(args.id)
        .then(personToResolver);
    },

    persons() {
      return api.fetchPersons()
        .then(persons => persons.map(personToResolver));
    },

    message(args) {
      return api.fetchMessage(args.id)
        .then(messageResolver);
    },
  };

  const personToResolver = personResolver.bind(undefined, resolver);

  return resolver;
}

describe('examples', () => {
  const resolver = rootResolver(api);

  example('persons', () => (
    expect(resolveObject(resolver, [{
      name: 'persons',
      include: [
        { name: 'name' },
      ]
    }])).to.eventually.eql({
      persons: [
        { name: 'john'},
        { name: 'alice'},
        { name: 'bob'},
      ]
    })
  ));

  example('person with friends and messages', () => (
    expect(resolveObject(resolver, [{
      name: 'person',
      args: { id: 1001 },
      include: [
        { name: 'name' },
        { name: 'age' },
        { name: 'friends',
          include: [
            'name',
            'age',
            {
              name: 'friends',
              include: [ 'name' ]
            }
          ]
        },
        { name: 'messages',
          include: [
            'content',
          ]
        }
      ]
    }])).to.eventually.eql({
      person: {
        name: 'john',
        age: 20,
        friends: [{
          age: 21,
          name: 'alice',
          friends: [{
            name: 'john'
          }],
        },{
          age: 22,
          name: 'bob',
          friends: [{
            name: 'john'
          }],
        }],
        messages: [{
          content: 'Message 1',
        },{
          content: 'Message 3',
        }]
      }
    })
  ));

  example('message', () => (
    expect(resolveObject(resolver, [{
      name: 'message',
      args: { id: 2003 },
      include: [ 'content', 'createdAt' ]
    }])).to.eventually.eql({
      message: {
        createdAt: 1477515403936,
        content: 'Message 3',
      }
    })
  ));
});
