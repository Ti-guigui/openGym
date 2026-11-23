-- Ti Guigui FIT: an admin can hand out a one-time reset code (24 h) when someone forgets their password.
-- Make an account admin with: npx wrangler d1 execute ti-guigui-fit --remote --command "UPDATE users SET admin = 1 WHERE name_key = 'nom en minuscules'"
ALTER TABLE users ADD COLUMN admin INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN reset_hash TEXT;
ALTER TABLE users ADD COLUMN reset_until INTEGER NOT NULL DEFAULT 0;
