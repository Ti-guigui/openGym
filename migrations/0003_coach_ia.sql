-- Ti Guigui FIT: the AI coach's daily message count per account (functions/api/[[path]].js, /api/ai/*).
-- Only a counter: the messages themselves are never stored on the server.
CREATE TABLE ai_usage (
  uid TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (uid, day)
);
