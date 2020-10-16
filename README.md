# SMARThome

SMARThome ist eine auf dem Komponenten UI Framwork7 basierende WEB Applikation zur komfortablen Bedienung von FHEM die freundliche Hausautomatisierung. Die Anbindung an FHEM erfolgt mit einem Framework7 Plugin. 
Die Entwicklung des Plugins basiert in Teilen auf die Entwicklungsarbeit von "knowthelist" und anderen für das Projekt "UI builder framework for FHEM (FTUI)" zum Steuern und Überwachen von in FHEM integrierten Geräten

**Entwickler:** Andreas Hartwig 2020 (MIT - Lizenz)

![](https://hartwiga.github.io/SMARThome/SMARThome_home1.jpeg)      ![](https://hartwiga.github.io/SMARThome/SMARThome_batchroom.jpeg)

Hinweis
-------
Diese Web Applikation ist zugeschnitten auf einen einzigen konkreten Anwendungsfall in Verbindung mit einer spezifischen FHEM Konfiguration. In einem anderen Kontext wird diese Applikation so nicht funktionieren. 

Benötigt
--------
[Framwork7 in der Verion v5.x.x](https://github.com/framework7io/framework7/tree/master/packages/core)

Installation
------------

 * Einfach den vollstänigen Quellpfad mit allen Dateien auf dem FHEM Server in das Verzeichnis **/\<fhem-path\>/www/mobile** kopieren und ggf. die Dateirechte anpassen.
 * Dem Verzeichnis das Framework7 hinzufügen
 * Die Datei mobile/js/config.js anpassen
 * Starte http://\<fhem-url\>:8083/fhem/mobile/index.html
 
Oder per FHEM Update 'update all https://raw.githubusercontent.com/hartwigs/SMARThome/master/controls_SMARThome.txt'
 
Links
-----

* Fhem von Rudolf Koenig http://www.fhem.de/fhem_DE.html
* Framework7 von Vladimir Kharlampidi https://framework7.io/
* UI builder framework for FHEM (FTUI) von knowthelist https://github.com/knowthelist/fhem-tablet-ui

Lizenz
------

[MIT Lizent](http://www.opensource.org/licenses/mit-license.php).
