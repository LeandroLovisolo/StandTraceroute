#!/usr/bin/env python2

from route_tracer import RouteTracer
from socket import gaierror
from os.path import dirname
from flask import Flask, jsonify
app = Flask(__name__, static_url_path = '', static_folder = 'frontend/dist/')

routeTracer = RouteTracer()

@app.route('/')
def root():
  return app.send_static_file('index.html')

@app.route('/api/traceroute/<hostname>')
def traceroute(hostname):
  if routeTracer.isTracing():
    return jsonify({'error': 'isTracing'})

  try:
    routeTracer.trace(hostname, 10, silent=True)
  except gaierror as e:
    return jsonify({'error': 'hostnameUnknown'})

  return jsonify({'ok': True})

@app.route('/api/routes')
def routes():
  return jsonify(routeTracer.toJsonSerializableHash())

if __name__ == '__main__':
  app.run(host='0.0.0.0', debug=True, use_debugger=True, use_reloader=False)
