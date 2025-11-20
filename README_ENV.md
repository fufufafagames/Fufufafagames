# 🔐 Environment Configuration Guide

## 📋 Cara Setup File .env

### 1. Copy Template

```bash
cp .env.example .env
```

### 2. Isi Konfigurasi Supabase

#### Mendapatkan Database URL:

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Settings** → **Database**
4. Copy **Connection String** (URI format)
5. Paste ke `DATABASE_URL` di file `.env`

Format:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require
```

#### Mendapatkan API Keys:

1. Di Supabase Dashboard, pergi ke **Settings** → **API**
2. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY` (jangan expose ke frontend!)

### 3. Generate Secret Keys

#### SESSION_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Konfigurasi Tambahan (Optional)

#### Email (jika pakai SMTP):

- Gunakan service seperti Gmail, SendGrid, atau Mailgun
- Isi `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`

#### Redis (untuk production):

- Install Redis server
- Isi `REDIS_HOST` dan `REDIS_PORT`

#### AWS S3 (untuk file storage):

- Buat bucket di AWS S3
- Isi credentials AWS

## 🔒 Security Best Practices

1. **JANGAN commit file `.env` ke Git**

   - File `.env` sudah ada di `.gitignore`
   - Gunakan `.env.example` sebagai template

2. **Gunakan strong secrets di production**

   - Ganti semua default secrets
   - Minimal 32 characters untuk SESSION_SECRET
   - Minimal 64 characters untuk JWT_SECRET

3. **Set NODE_ENV=production di production**

   ```
   NODE_ENV=production
   ```

4. **Enable HTTPS di production**
   ```
   SESSION_SECURE=true
   ```

## 📝 Perbedaan dengan Laravel .env

| Laravel               | Node.js                         | Keterangan             |
| --------------------- | ------------------------------- | ---------------------- |
| `APP_ENV`             | `NODE_ENV`                      | Environment mode       |
| `APP_KEY`             | `SESSION_SECRET` + `JWT_SECRET` | Encryption keys        |
| `DB_USERNAME`         | `DB_USER`                       | Database user          |
| `DB_CONNECTION=pgsql` | `DB_CONNECTION=postgresql`      | Driver name            |
| `${VAR}`              | `process.env.VAR`               | Variable interpolation |

## 🚀 Cara Menggunakan di Code

```javascript
// Load environment variables
require("dotenv").config();

// Access variables
const dbUrl = process.env.DATABASE_URL;
const port = process.env.PORT || 3000;
const supabaseUrl = process.env.SUPABASE_URL;

// Example: Database connection
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

## ✅ Verifikasi Setup

Jalankan server untuk test:

```bash
npm run dev
```

Jika berhasil, Anda akan melihat:

```
✅ Database connected successfully
🚀 FUFUFAFAGAMES Server running on http://localhost:3000
📦 Environment: development
🎮 Ready to play games!
```

## 🆘 Troubleshooting

### Error: "Cannot find module 'dotenv'"

```bash
npm install dotenv
```

### Error: "Database connection failed"

- Periksa `DATABASE_URL` sudah benar
- Pastikan IP Anda sudah di-whitelist di Supabase
- Test koneksi dengan:

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"
```

### Error: "Session secret is not set"

- Pastikan `SESSION_SECRET` sudah diisi di `.env`
- Restart server setelah mengubah `.env`

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Node.js dotenv](https://github.com/motdotla/dotenv)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
