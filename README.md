StandTraceroute
===============

Implementación de [traceroute](https://en.wikipedia.org/wiki/Traceroute) acompañada de una interfaz web que dibuja en un mapa interactivo las rutas descubiertas desde la computadora donde corre la aplicación y el host ingresado por el usuario.

Esta aplicación fue creada para ser exhibida en un stand durante la [Semana de la Computación 2015](http://www.dc.uba.ar/events/sdc/2015) de la [Universidad de Buenos Aires](http://www.uba.ar).

Requerimientos
--------------

Se requieren las siguientes bibliotecas Python versión 2.x:

- scapy
- pygeoip
- matplotlib
- basemap

Para instalar dichas dependencias en Arch Linux, basta con ejecutar los siguientes comandos como usuario root:

`pacman -S python2-pip python2-pygeoip python2-matplotlib python2-basemap`

`pip2 install scapy`

Luego de instalar las bibliotecas Python es necesario bajar la base de datos de geolocación [Maxmind GeoLite City](http://dev.maxmind.com/geoip/legacy/geolite/), para lo que se provee un objetivo en el Makefile:

`make download-geolocation-db`

Uso
---

El script central es `traceroute`.

Como ejemplo de uso, para hacer un traceroute a `www.google.com`, ejecutar lo siguiente como usuario root:

`./traceroute www.google.com`

El script imprime IPs, ubicación geográfica (cuando es posible), RTTs y ZRTTs para cada hop.
