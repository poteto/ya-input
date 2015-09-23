import Ember from 'ember';
import layout from '../../templates/ya-input';

const {
  Component,
  defineProperty,
  isEmpty,
  on,
  get,
  set,
  getWithDefault,
  computed,
  String: { dasherize },
  computed: { oneWay },
  A: emberArray
} = Ember;

function defaultCPSetter(_key, newValue) {
  return newValue;
}

const YaInputComponent = Component.extend({
  layout,
  type: 'text',
  classNameBindings: ['validClass', 'type'],
  hasFocusedOnce: false,
  hasLostFocus: false,
  hasInitialFocus: false,

  model: oneWay('form.model'),
  modelName: computed({
    get() {
      return get(this, 'model.constructor.modelName');
    }
  }).readOnly(),
  shouldShowValidationErrors: oneWay('model.shouldShowValidationErrors'),
  errorText: oneWay('errors.firstObject'),

  inputId: computed('model', 'field-name', {
    get() {
      const modelName = getWithDefault(this, 'modelName', get(this, 'model').toString());

      return dasherize(`${modelName}-${get(this, 'field-name')}`);
    },
    set: defaultCPSetter
  }),

  name: computed('fieldName', {
    get() {
      return dasherize(get(this, 'field-name'));
    },
    set: defaultCPSetter
  }),

  value: computed('model', 'field-name', {
    get() {
      const model = get(this, 'model');
      const fieldName = get(this, 'field-name');

      return model ? get(model, fieldName) : null;
    },
    set(_key, newValue) {
      const model = get(this, 'model');
      const fieldName = get(this, 'field-name');

      return model ? set(model, fieldName, newValue) : null;
    }
  }),

  canShowErrors: computed('errors.[]', 'hasLostFocus', 'shouldShowValidationErrors', {
    get() {
      const errorsCount = get(this, 'errors.length');
      const hasLostFocus = get(this, 'hasLostFocus');
      const shouldShowValidationErrors = get(this, 'shouldShowValidationErrors');

      return !!(errorsCount > 0 && (hasLostFocus || shouldShowValidationErrors));
    },
    set: defaultCPSetter
  }),

  validClass: computed('errors.[]', 'field-name', 'canShowErrors', 'errorText', 'hasFocusedOnce', 'shouldShowValidationErrors', {
    get() {
      return this._getValidClass(get(this, 'model.errors'), get(this, 'field-name'));
    }
  }),

  focusIn() {
    set(this, 'hasLostFocus', false);
    set(this, 'hasInitialFocus', true);
  },

  focusOut() {
    set(this, 'hasFocusedOnce', true);
    set(this, 'hasLostFocus', true);
  },

  /**
   * Logic for the input's validClass.
   *
   * @private
   * @param {Array} modelErrors
   * @param {String} fieldName
   * @return {String}
   */
  _getValidClass(modelErrors, fieldName) {
    if (get(this, 'hasFocusedOnce') || get(this, 'shouldShowValidationErrors')) {
      if (this._hasDSError(modelErrors, fieldName)) {
        return 'is-invalid';
      }

      return get(this, 'canShowErrors') ? 'is-invalid' : 'is-valid';
    }
  },

  /**
   * Adds the `errors` computed property at runtime, when the component is
   * initialized with attrs.
   *
   * @private
   * @return {Void}
   */
  _addErrorsComputedProperty: on('didInitAttrs', function() {
    const modelName = get(this, 'attrs.form.model.constructor.modelName');
    const fieldName = get(this, 'attrs.field-name');
    let errorKey = `form.errors.model.${fieldName}`;

    if (modelName) {
      errorKey = `form.errors.${modelName}.${fieldName}`;
    }

    defineProperty(this, 'errors', computed(errorKey, `form.model.${fieldName}`, 'field-name', {
      get() {
        return get(this, errorKey);
      },
      set: defaultCPSetter
    }));
  }),

  /**
   * Checks for the existence of the field-name on the `DS.Errors` object added
   * by Ember Data rejections.
   *
   * @private
   * @param {Array} modelErrors
   * @param {String} fieldName
   * @return {Boolean}
   */
  _hasDSError(modelErrors = emberArray(), fieldName = '') {
    modelErrors = emberArray(modelErrors); // ensures we have `findBy`

    if (isEmpty(modelErrors)) {
      return false;
    }

    return !!modelErrors.findBy('attribute', fieldName);
  }
});

export default YaInputComponent.reopenClass({
  positionalParams: ['form', 'field-name']
});
