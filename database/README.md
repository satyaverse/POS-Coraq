# Coraq POS Database

Tanggal: 2026-06-27

Database target: MySQL 8.x, InnoDB, `utf8mb4`.

## Create Database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS coraq_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## Run Migration

```bash
mysql -u root -p coraq_pos < database/migrations/001_create_core_schema.sql
```

On Windows PowerShell, use `cmd /c` for input redirection:

```powershell
cmd /c "mysql -u root -p coraq_pos < database\migrations\001_create_core_schema.sql"
```

## Run Seed

```bash
mysql -u root -p coraq_pos < database/seeds/001_seed_initial_data.sql
```

On Windows PowerShell:

```powershell
cmd /c "mysql -u root -p coraq_pos < database\seeds\001_seed_initial_data.sql"
```

## Reset Local Database

Only use this for local development.

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS coraq_pos; CREATE DATABASE coraq_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p coraq_pos < database/migrations/001_create_core_schema.sql
mysql -u root -p coraq_pos < database/seeds/001_seed_initial_data.sql
```

## Inspect Tables

```bash
mysql -u root -p coraq_pos -e "SHOW TABLES;"
mysql -u root -p coraq_pos -e "SELECT id, name, role_id FROM users;"
mysql -u root -p coraq_pos -e "SELECT id, name, stock_qty, usage_unit FROM ingredients;"
```

## Seed Behavior

The seed file uses fixed IDs from the current demo data where practical. It is written with `INSERT ... ON DUPLICATE KEY UPDATE` for most reference rows so it can be rerun during local development.

The seed includes demo PIN hashes generated with MySQL `SHA2(pin, 256)`. This is acceptable only for local demo seed data. Production should use a dedicated password/PIN hashing strategy such as Argon2id or bcrypt in the backend application layer.

## Current Runtime Note

This database is the future source of truth. The current frontend still reads and writes localStorage until backend API integration is implemented.
