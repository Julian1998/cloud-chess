# Nextcloud development adapter

This local-only stack runs Nginx, Nextcloud FPM, MariaDB, and a Composer workspace. The adapter source at `app/` is mounted into all relevant containers.

```bash
cp .env.example .env
docker compose up -d
```

Open <http://localhost:8080> and sign in with the local development credentials from `.env`.

Useful commands:

```bash
docker compose ps
docker compose logs -f app web db
docker compose exec workspace composer --version
docker compose down
```

To discard the local Nextcloud database and files completely, run `docker compose down -v`.
