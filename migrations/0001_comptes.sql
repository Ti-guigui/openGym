-- Ti Guigui FIT accounts on Cloudflare D1 (functions/api/[[path]].js): a nickname and a password hash, nothing personal.
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL UNIQUE,
  pw TEXT NOT NULL,
  created TEXT NOT NULL,
  fails INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE sessions (
  hash TEXT PRIMARY KEY,
  uid TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exp INTEGER NOT NULL
);
CREATE INDEX sessions_uid ON sessions(uid);
CREATE TABLE states (
  uid TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  doc TEXT NOT NULL,
  rev INTEGER NOT NULL,
  wid TEXT NOT NULL
);
