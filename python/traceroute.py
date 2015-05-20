#!/usr/bin/env python2
# encoding: utf-8

import argparse
import json
from route_tracer import RouteTracer

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('hostname',
                        help='trace route to [hostname] and measure round-trip times to each hop')
    parser.add_argument('-t', '--time',
                        type=int, default=10,
                        help='measure round-trip times for TIME seconds (default 10)')
    args = parser.parse_args()

    # Do the actual traceroute
    routeTracer = RouteTracer()
    routeTracer.trace(args.hostname, args.time)
