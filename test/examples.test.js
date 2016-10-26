'use strict';

const resolveFields = require('..');

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
}

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
}

class PersonResolver {
  constructor({ parentResolver, person }) {
    this.parentResolver = parentResolver;
    this.person = person;
  }

  name() {
    return this.person.name;
  }

  age() {
    return this.person.age;
  }

  friends() {
    return Promise.all(this.person.friends.map(id => this.parentResolver.person({ id })))
  }

  messages() {
    return Promise.all(this.person.messages.map(id => this.parentResolver.message({ id })))
  }
}

class MessageResolver {
  constructor({ parentResolver, message }) {
    this.parentResolver = parentResolver;
    this.message = message;
  }

  content() {
    return this.message.content;
  }
}

class RootResolver {
  constructor({ api }) {
    this.api = api;
  }

  person({ id }) {
    return this.api.fetchPerson(id)
      .then(person => new PersonResolver({ parentResolver: this, person }))
  }

  persons() {
    return this.api.fetchPersons()
      .then(persons => persons.map(person => new PersonResolver({ parentResolver: this, person })))
  }

  message({ id }) {
    return this.api.fetchMessage(id)
      .then(message => new MessageResolver({ parentResolver: this, message }))
  }
}

describe('examples', () => {
  const resolver = new RootResolver({ api });
  const resolve = resolveFields.bind(null, resolver);

  it('persons', () => (
    expect(resolve([{
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

  it('person with friends and messages', () => (
    expect(resolve([{
      name: 'person',
      args: { id: 1001 },
      include: [
        { name: 'name' },
        { name: 'age' },
        { name: 'friends',
          include: [
            'name',
            'age'
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
        },{
          age: 22,
          name: 'bob'
        }],
        messages: [{
          content: 'Message 1',
        },{
          content: 'Message 3',
        }]
      }
    })
  ));

  it('message', () => (
    expect(resolve([{
      name: 'message',
      args: { id: 2003 },
      include: [ 'content' ]
    }])).to.eventually.eql({
      message: {
        content: 'Message 3',
      }
    })
  ));
})