import Ember from 'ember';

export default Ember.Route.extend({
  afterModel: function() {
    Ember.run.scheduleOnce('afterRender', this, function() {
      this.controller.bindResizeEvent();
      this.controller.resizeInterface();
    });
  },

  deactivate: function() {
    this.controller.unbindResizeEvent();
  }
});
