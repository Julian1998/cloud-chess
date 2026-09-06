# Game Invitations Design

## Ziel

Der erste fachliche Core-Slice ermöglicht eine Korrespondenzschach-Einladung zwischen zwei Plattformbenutzern. Eine angenommene Einladung erzeugt atomar eine neue Partie. Nextcloud, Datenbank, HTTP und Schachregelbibliotheken gehören nicht zu diesem Slice.

## Aggregate-Grenzen

`GameInvitation` und `Game` sind getrennte Aggregate.

`GameInvitation` verhandelt ausschließlich die Konditionen einer möglichen Partie:

```text
InvitationId
challengerId
opponentId
colorPreference  # white | black | random
turnDuration     # 1 day | 2 days
status
createdAt
expiresAt         # createdAt + 7 days
```

Die Einladung enthält keine tatsächliche Farbzuordnung. `Game` besitzt die beim Annehmen festgelegten `whitePlayerId` und `blackPlayerId`, den Spielzustand und die erste Zugfrist.

## Zustandsautomat

```text
pending
  ├─ opponent accepts ───► accepted
  ├─ opponent declines ──► declined
  ├─ challenger cancels ─► cancelled
  └─ clock reaches expiresAt ► expired
```

Nur `pending` ist veränderbar. Alle Endzustände sind endgültig.

## Berechtigungen und Invarianten

- Nur `opponentId` kann eine Einladung annehmen oder ablehnen.
- Nur `challengerId` kann sie zurückziehen.
- Eine offene Einladung darf nicht durch einen anderen Benutzer verändert werden.
- Zwischen denselben zwei Spielern ist höchstens eine `pending`-Einladung pro Richtung zulässig.
- `TurnDuration` ist ausschließlich `P1D` oder `P2D`.
- Eine abgelaufene Einladung kann nicht angenommen werden.

## Annahme und Transaktion

Der Application-Service `AcceptInvitation` lädt die bestehende Einladung und führt innerhalb eines `TransactionRunner` aus:

1. Actor, Status und Ablaufzeit prüfen.
2. Einladung auf `accepted` setzen.
3. Aus `colorPreference` die tatsächliche Farbzuordnung bestimmen; bei `random` genau einmal serverseitig.
4. Ein neues `Game` mit dieser Zuordnung, der gewählten `TurnDuration` und der ersten Zugfrist erzeugen.
5. Einladung und Partie gemeinsam speichern.

Ein Fehler rollt beide Aggregate zurück. Die erste Zugfrist gehört ausschließlich zur Partie und beginnt mit ihrer Erzeugung.

## Ablauf

`expired` ist ein fachlicher Zustand, kein Client-Befehl. Ein späterer Background Job kann abgelaufene Einladungen markieren; bis dahin muss jeder lesende oder schreibende Use Case den Zeitstempel gegen `Clock` prüfen und eine abgelaufene Einladung als nicht mehr offen behandeln.

## Nicht im Umfang

- keine Schachzüge, FEN, PGN oder `ChessRules`;
- keine Datenbank- oder Nextcloud-Implementierung;
- keine HTTP-/API-Platform-Ressourcen;
- keine Notifications oder Background-Jobs.
