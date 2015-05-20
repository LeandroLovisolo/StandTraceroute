import Ember from 'ember';
import ajax from 'ic-ajax';

export default Ember.Controller.extend({
  hostname: '',
  errorMessage: '',
  loading: false,
  hops: [],
  hopsEmpty: Ember.computed.empty('hops'),

  // Google map properties
  zoom: 2,
  latitude: 0,
  longitude: 0,
  polylines: [],
  markers: [],
  googleMapObject: null,

  resizeInterface: function() {
    var self = this; // jshint ignore:line
    ['.map-canvas', '.hop-list'].forEach(function(selector) {
      if(Ember.$(selector).length === 0) { return; }
      var height;
      if(Ember.$(window).width() < 768) {
        // Single column layout (extra small devices as per Bootstrap grid)
        height = 400;
      } else {
        // Multi column layout (small devices and up)
        height = Ember.$(window).height() - Ember.$(selector).offset().top;
        if(selector === '.hop-list') {
          height -= 15;
        }
      }
      Ember.$(selector).css('height', height + 'px');
      if(selector === '.map-canvas') {
        // jshint ignore:start
        google.maps.event.trigger(self.get('googleMapObject'), 'resize');
        // jshint ignore:end
      }
    });
  },

  resizeAfterLoadingWheel: function() {
    Ember.run.scheduleOnce('afterRender', this, function() {
      this.resizeInterface();
    });
  }.observes('loading'),

  bindResizeEvent: function() {
    this.resizeEventHandler = Ember.run.bind(this, this.resizeInterface);
    Ember.$(window).on('load resize', this.resizeEventHandler);
  },

  unbindResizeEvent: function() {
    Ember.$(window).off('load resize', this.resizeEventHandler);
  },

  startUpdatingRoutes: function() {
    this.set('loading', true);
    var self = this;
    this.updateRoutesInterval = setInterval(function() {
      self.updateRoutes();
    }, 1000);
  },

  stopUpdatingRoutes: function() {
    this.set('loading', false);
    clearInterval(this.updateRoutesInterval);
  },

  willDestroy: function() {
    this.stopUpdatingRoutes();
  },

  updateRoutes: function() {
    var self = this;
    ajax({
      url: '/api/routes'
    }).then(function(data) {
      if(!data.stillTracing) {
        self.stopUpdatingRoutes();
      } else {
      }
      self.updateHops(data.hops);
    }).catch(function() {
      self.stopUpdatingRoutes();
    });
  },

  updateHops: function(hops) {
    var validHops = [];
    for(var i = 0; i < hops.length; i++) {
      hops[i].gateways = hops[i].gateways.filter(function(gateway) {
        return gateway.location !== '*';
      });
      if(hops[i].gateways.length > 0) {
        validHops.push(hops[i]);
        if(hops[i].isDestination) {
          break;
        }
      }
    }
    this.set('hops', validHops);
  },

  updateMarkers: function() {
    var markers = [];
    this.get('hops').forEach(function(hop) {
      hop.gateways.forEach(function(gateway) {
        markers.push({
          title: gateway.location,
          lat: gateway.latitude,
          lng: gateway.longitude,
          ip: gateway.ip,
          ttl: hop.ttl,
          rtt: hop.absRtt,
          infoWindowTemplateName: 'marker-info-window'
        });
      });
    });
    this.set('markers', markers);
  }.observes('hops'),

  updatePolylines: function() {
    var polylines = [];
    var hops = this.get('hops');
    for(var i = 0; i < hops.length - 1; i++) {
      // jshint loopfunc:true
      hops[i].gateways.forEach(function(srcGw) {
        hops[i + 1].gateways.forEach(function(dstGw) {
          polylines.push({
            isEditable: false,
            path: [
              {lat: srcGw.latitude, lng: srcGw.longitude},
              {lat: dstGw.latitude, lng: dstGw.longitude}
            ],
            strokeOpacity: 0.8,
            strokeColor: 'blue'
          });
        });
      });
    }
    this.set('polylines', polylines);
  }.observes('hops'),

  hostnameUpdated: function() {
    this.set('errorMessage', '');
  }.observes('hostname'),

  actions: {
    trace: function() {
      if(this.get('hostname').trim() === '') {
        this.set('errorMessage', 'Tenés que ingresar un hostname.');
        return;
      }

      this.set('errorMessage', '');
      this.set('loading', true);
      var self = this;
      ajax({
        url: '/api/traceroute/' + encodeURIComponent(this.get('hostname'))
      }).then(function(res) {
        if(res.ok) {
          self.startUpdatingRoutes();
        } else {
          self.set('loading', false);
          if(res.error === 'isTracing') {
            self.set('errorMessage',
                     'Ya hay una traza en curso. Esperá algunos segundos e ' +
                     'intentá de nuevo.');
          }
          if(res.error === 'hostnameUnknown') {
            self.set('errorMessage', 'Hostname desconocido.');
          }
        }
      }).catch(function() {
        this.set('loading', false);
      });
    }
  }
});
