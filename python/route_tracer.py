import os
import sys
import socket
import logging
logging.getLogger('scapy.runtime').setLevel(logging.ERROR)
from scapy.all import *
from random import randint
from threading import Thread
from route import Route
from statistics import print_statistics

MAX_TTL         = 30
PACKET_TIMEOUT  = 1

class RouteTracer:
  def __init__(self):
    self._route = None
    self._tracing = False
    self._thread = None

  def trace(self, hostname, seconds, silent=False):
    # Force an exception before launching the tracing thread in case the
    # hostname provided is unknown.
    socket.gethostbyname(hostname)

    if self._thread is not None and self._thread.is_alive():
      self._tracing = False
      self._thread.join()
    self._thread = Thread(target=self._do_trace,
                          args=(hostname, seconds, silent))
    self._thread.start()

  def _do_trace(self, hostname, seconds, silent):
    dst_ip = socket.gethostbyname(hostname)
    self._route = Route(dst_ip)
    self._tracing = True

    t0 = time.time()
    last_id = 0

    while self._tracing and time.time() - t0 < seconds:
      base_id = last_id

      pkts = []
      for ttl in range(1, MAX_TTL + 1):
        id = base_id + ttl
        pkts.append(IP(dst=dst_ip, ttl=ttl) / ICMP(id=id))

      last_id = id

      try:
        ans, unans = sr(pkts, verbose=0, timeout=PACKET_TIMEOUT)
      except socket.error as e:
        sys.exit(e)

      for snd, rcv in ans:
        # ICMP packet type Echo Reply
        if rcv.type == 0:
          # Use the ICMP Echo Reply Identifier field
          id = rcv[1].id

        # ICMP packet type Time Exceeded
        elif rcv.type == 11:
          # Use the Identifier field in the original ICMP Echo Request
          id = rcv[3].id

        # Ignore responses of any other kind (unlikely to happen)
        else: continue

        # Check that the received packet is a response to
        # a packet from the current batch.
        if id < base_id + 1 or id > base_id + 30:
          continue

        ttl  = id - base_id
        ip   = rcv.src
        type = rcv.type
        rtt  = (rcv.time - snd.sent_time) * 1000
        self._route[ttl].add_reply(ip, type, rtt)

      if not silent:
        os.system('clear')
        print_statistics(self._route)

    self._tracing = False

  def isTracing(self):
    return self._tracing

  def toJsonSerializableHash(self):
    if self._route is None:
      return {}
    else:
      return {
        'stillTracing': self._tracing,
        'hops': self._route.toJsonSerializableHash()
      }

