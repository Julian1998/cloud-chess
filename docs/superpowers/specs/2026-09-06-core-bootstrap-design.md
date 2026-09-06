# Core Bootstrap Design

## Ziel

Eine lokal via Docker Compose ausführbare Grundlage für das einzelne Composer-Paket `chess-core` schaffen. Der Umfang endet nach Projektstruktur, PHP-Tooling und einem nachgewiesenen Test-/Analyse-Workflow; fachliche Schachtypen und Nextcloud folgen später.

## Paket- und Architekturgrenzen

`packages/chess-core` ist der zukünftige auslagerbare Kern. Es besitzt diese Namespace-Grenzen:

```text
CloudChess\\Core\\Domain
CloudChess\\Core\\Application
CloudChess\\Core\\Ports
CloudChess\\Core\\Presentation\\ChessApi
```

`Domain` enthält zukünftig ausschließlich das Fachmodell. `Application` orchestriert Use Cases. `Ports` enthält vom Kern besessene Verträge; konkrete Implementierungen liegen in auslagerbaren Adaptern. `Presentation\\ChessApi` ist der eingehende Presentation Adapter für API-Platform-Ressourcen, Inputs, Outputs, Provider und Processor. Er veröffentlicht nie Domain- oder Persistenzobjekte direkt.

Für diesen Bootstrap werden nur die Verzeichnisse erzeugt; API Platform wird noch nicht eingebunden. Dadurch bleibt die erste verifizierbare Umgebung frei von einer unnötigen Laufzeitabhängigkeit.

## Lokaler Betrieb

`compose.yaml` definiert genau einen PHP-CLI-Dienst namens `php`. Sein Image wird aus einem lokalen Dockerfile gebaut und enthält PHP 8.3 CLI sowie Composer. Das Repository wird nach `/app` gemountet; Commands laufen gezielt im Paketverzeichnis.

Die einzigen vorgesehenen Befehle sind:

```bash
docker compose run --rm php composer install
docker compose run --rm php composer test
docker compose run --rm php composer analyse
```

Es gibt bewusst keine Datenbank, Nextcloud-Instanz, HTTP-Laufzeit oder langlebigen Container. Diese Komponenten sind erst notwendig, wenn ein ausgehender Persistenzadapter beziehungsweise ein Nextcloud-Hostadapter entsteht.

## Tooling

- PHP 8.3 als festgelegte Entwicklungsbasis.
- Composer mit PSR-4-Autoloading für `CloudChess\\Core\\`.
- PHPUnit für Domain- und Application-Tests.
- PHPStan auf Level 8 für `src/` und `tests/`.

Ein minimaler Smoke-Test beweist die PHPUnit-Verdrahtung. Er testet einen namenlosen, lokal im Test definierten Wert und führt keinerlei Produktionsverhalten ein. PHPStan prüft dieselben Quellen.

## Abnahmekriterien

1. Der Worktree enthält die definierte Monorepo-Struktur und das Composer-Paket.
2. `docker compose run --rm php composer install` installiert Abhängigkeiten reproduzierbar.
3. `docker compose run --rm php composer test` beendet sich erfolgreich und führt den Smoke-Test aus.
4. `docker compose run --rm php composer analyse` beendet sich erfolgreich ohne statische Analysefehler.
5. README beschreibt die drei lokalen Docker-Commands sowie die Layer-Grenzen.

## Nicht im Umfang

- keine Domain-Typen oder Use Cases;
- keine API-Platform- oder Symfony-Abhängigkeit;
- keine Datenbank, Nextcloud, React oder Node-Tooling;
- keine konkreten Ports oder Infrastrukturadapter.
