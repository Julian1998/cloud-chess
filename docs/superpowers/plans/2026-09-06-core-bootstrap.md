# Core Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Einen Docker-Compose-basierten, reproduzierbaren lokalen Entwicklungs- und Prüfworkflow für das auslagerbare Composer-Paket `chess-core` bereitstellen.

**Architecture:** Das Monorepo enthält ein einzelnes PHP-Paket unter `packages/chess-core`. Es definiert nur die leeren Core-Layer `Domain`, `Application`, `Ports` und `Presentation/ChessApi`; konkrete technische Adapter bleiben außerhalb. Ein einzelner PHP-CLI-Container führt Composer, PHPUnit und PHPStan aus.

**Tech Stack:** PHP 8.3 CLI, Composer 2, Docker Compose, PHPUnit 11, PHPStan 1.

**Spec:** `docs/superpowers/specs/2026-09-06-core-bootstrap-design.md`

## Global Constraints

- Verwende PHP 8.3 als Entwicklungsbasis.
- `packages/chess-core` ist das einzige Composer-Paket dieses Schritts.
- Produktionscode bleibt vollständig frei von Nextcloud-, Datenbank-, Symfony- und API-Platform-Abhängigkeiten.
- Lege `Domain`, `Application`, `Ports` und `Presentation/ChessApi` nur als Namespace-Grenzen an; implementiere keine Fachtypen oder Ports.
- Lokale Befehle laufen ausschließlich über `docker compose run --rm php`.
- Es gibt keine Datenbank, keine Nextcloud-Instanz und keinen langlebigen Service.

---

### Task 1: Docker-Compose- und PHP-CLI-Grundlage

**Files:**
- Create: `Dockerfile`
- Create: `compose.yaml`
- Create: `.dockerignore`
- Create: `.env.example`

**Interfaces:**
- Produces: Dienst `php`, der das Repository unter `/app` bereitstellt und im Verzeichnis `/app/packages/chess-core` startet.

- [ ] **Step 1: Dockerfile mit PHP 8.3 und Composer schreiben**

```dockerfile
FROM php:8.3-cli-alpine

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app/packages/chess-core
```

- [ ] **Step 2: Compose-Dienst schreiben**

```yaml
services:
  php:
    build: .
    working_dir: /app/packages/chess-core
    volumes:
      - .:/app
```

- [ ] **Step 3: Build als Umgebungsnachweis ausführen**

Run: `docker compose build php`

Expected: Exit-Code `0` und ein gebautes Image für den Dienst `php`.

- [ ] **Step 4: Composer im Container prüfen**

Run: `docker compose run --rm php composer --version`

Expected: Exit-Code `0` und eine Composer-2-Versionsausgabe.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile compose.yaml .dockerignore .env.example
git commit -m "chore: add PHP development container"
```

### Task 2: Composer-Paket und Layer-Grenzen

**Files:**
- Create: `packages/chess-core/composer.json`
- Create: `packages/chess-core/src/Domain/.gitkeep`
- Create: `packages/chess-core/src/Application/.gitkeep`
- Create: `packages/chess-core/src/Ports/.gitkeep`
- Create: `packages/chess-core/src/Presentation/ChessApi/.gitkeep`

**Interfaces:**
- Consumes: Der Dienst `php` aus Task 1.
- Produces: PSR-4-Namespace `CloudChess\\Core\\` nach `src/` sowie Composer-Skripte `test` und `analyse`.

- [ ] **Step 1: Composer-Konfiguration schreiben**

```json
{
  "name": "cloud-chess/chess-core",
  "description": "Portable application core for Cloud Chess.",
  "type": "library",
  "require": { "php": "^8.3" },
  "require-dev": {
    "phpstan/phpstan": "^1.12",
    "phpunit/phpunit": "^11.0"
  },
  "autoload": { "psr-4": { "CloudChess\\Core\\": "src/" } },
  "autoload-dev": { "psr-4": { "CloudChess\\Core\\Tests\\": "tests/" } },
  "scripts": {
    "test": "phpunit --configuration=phpunit.xml",
    "analyse": "phpstan analyse --configuration=phpstan.neon"
  }
}
```

- [ ] **Step 2: Layer-Verzeichnisse anlegen**

Run: `mkdir -p packages/chess-core/src/{Domain,Application,Ports,Presentation/ChessApi} packages/chess-core/tests`

Expected: Alle vier leeren Layer-Grenzen und `tests/` existieren.

- [ ] **Step 3: Abhängigkeiten installieren**

Run: `docker compose run --rm php composer install`

Expected: Exit-Code `0` und `packages/chess-core/composer.lock` ist erstellt.

- [ ] **Step 4: Autoloader prüfen**

Run: `docker compose run --rm php php -r "require 'vendor/autoload.php'; echo 'autoload ok', PHP_EOL;"`

Expected: Exakt `autoload ok` und Exit-Code `0`.

- [ ] **Step 5: Commit**

```bash
git add packages/chess-core
git commit -m "chore: add portable core package"
```

### Task 3: PHPUnit-Smoke-Test und PHPStan

**Files:**
- Create: `packages/chess-core/phpunit.xml`
- Create: `packages/chess-core/phpstan.neon`
- Create: `packages/chess-core/tests/SmokeTest.php`

**Interfaces:**
- Consumes: Composer-Autoloading und Entwicklungsabhängigkeiten aus Task 2.
- Produces: Erfolgreiche Composer-Skripte `test` und `analyse` innerhalb des Docker-Containers.

- [ ] **Step 1: Zuerst einen minimalen PHPUnit-Test schreiben**

```php
<?php

declare(strict_types=1);

namespace CloudChess\\Core\\Tests;

use PHPUnit\\Framework\\TestCase;

final class SmokeTest extends TestCase
{
    public function test_test_environment_is_available(): void
    {
        self::assertTrue(true);
    }
}
```

- [ ] **Step 2: Testlauf vor PHPUnit-Konfiguration ausführen**

Run: `docker compose run --rm php composer test`

Expected: FAIL, weil PHPUnit ohne Konfiguration noch keinen Testsuite-Pfad kennt.

- [ ] **Step 3: PHPUnit- und PHPStan-Konfiguration schreiben**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit bootstrap="vendor/autoload.php" colors="true">
  <testsuites>
    <testsuite name="core">
      <directory>tests</directory>
    </testsuite>
  </testsuites>
</phpunit>
```

```neon
parameters:
  level: 8
  paths:
    - src
    - tests
```

- [ ] **Step 4: Test- und Analyseworkflow ausführen**

Run: `docker compose run --rm php composer test && docker compose run --rm php composer analyse`

Expected: PHPUnit führt genau einen erfolgreichen Test aus; PHPStan endet ohne Fehler.

- [ ] **Step 5: Commit**

```bash
git add packages/chess-core/phpunit.xml packages/chess-core/phpstan.neon packages/chess-core/tests/SmokeTest.php
git commit -m "test: verify core tooling"
```

### Task 4: Repository-Dokumentation und lokale Konventionen

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Die drei bestätigten Docker-Commands aus Tasks 1–3.
- Produces: Eine kurze, reproduzierbare Anleitung für neue Mitwirkende.

- [ ] **Step 1: Generierte und lokale Dateien ignorieren**

Append to `.gitignore`:

```gitignore
.env
packages/chess-core/vendor/
```

- [ ] **Step 2: Lokalen Entwicklungsabschnitt in README ergänzen**

````markdown
## Local development

Run all PHP tooling inside Docker:

```bash
docker compose run --rm php composer install
docker compose run --rm php composer test
docker compose run --rm php composer analyse
```

`packages/chess-core` owns `Domain`, `Application`, `Ports`, and the incoming `Presentation/ChessApi` boundary. Concrete platform and technology adapters stay outside the package.
````

- [ ] **Step 3: Vollständige Abnahme wiederholen**

Run: `docker compose run --rm php composer install && docker compose run --rm php composer test && docker compose run --rm php composer analyse`

Expected: Alle drei Befehle enden mit Exit-Code `0`.

- [ ] **Step 4: Commit**

```bash
git add README.md .gitignore packages/chess-core/composer.lock
git commit -m "docs: document local core workflow"
```
