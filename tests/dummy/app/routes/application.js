import Ember from 'ember';

const {
  Object: EmberObject,
  Route,
  computed,
  get
} = Ember;

export default Route.extend({
  model() {
    const User = EmberObject.extend({
      toString() {
        return 'User';
      },
      fullName: computed('firstName', 'lastName', {
        get() {
          return `${get(this, 'firstName')} ${get(this, 'lastName')}`;
        }
      })
    });

    return User.create({
      firstName: 'Derek',
      lastName: 'Zoolander',
      jobTitle: undefined
    });
  }
});
