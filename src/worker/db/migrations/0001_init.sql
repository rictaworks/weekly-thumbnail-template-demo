CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE generations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(session_id),
  template_code TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  topic_raw TEXT NOT NULL,
  topic_normalized TEXT NOT NULL,
  font_size INTEGER NOT NULL,
  line_count INTEGER NOT NULL,
  verdict TEXT NOT NULL,
  revision_no INTEGER NOT NULL,
  origin TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_generations_session ON generations(session_id);
CREATE INDEX idx_generations_session_template_week ON generations(session_id, template_code, week_number);

CREATE TABLE generation_lines (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(session_id),
  generation_id TEXT NOT NULL REFERENCES generations(id),
  seq INTEGER NOT NULL,
  text TEXT NOT NULL,
  width INTEGER NOT NULL,
  baseline_y INTEGER NOT NULL
);

CREATE INDEX idx_generation_lines_session ON generation_lines(session_id);
CREATE INDEX idx_generation_lines_generation ON generation_lines(generation_id);

CREATE TABLE findings (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(session_id),
  generation_id TEXT REFERENCES generations(id),
  batch_item_id TEXT,
  code TEXT NOT NULL,
  severity TEXT NOT NULL,
  target TEXT NOT NULL,
  detail TEXT NOT NULL
);

CREATE INDEX idx_findings_session ON findings(session_id);
CREATE INDEX idx_findings_generation ON findings(generation_id);
CREATE INDEX idx_findings_batch_item ON findings(batch_item_id);

CREATE TABLE batches (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(session_id),
  template_code TEXT NOT NULL,
  item_count INTEGER NOT NULL,
  state TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_batches_session ON batches(session_id);

CREATE TABLE batch_items (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(session_id),
  batch_id TEXT NOT NULL REFERENCES batches(id),
  seq INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  topic_raw TEXT NOT NULL,
  verdict TEXT NOT NULL,
  generation_id TEXT REFERENCES generations(id),
  state TEXT NOT NULL
);

CREATE INDEX idx_batch_items_session ON batch_items(session_id);
CREATE INDEX idx_batch_items_batch ON batch_items(batch_id);

CREATE TABLE exports (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(session_id),
  generation_id TEXT NOT NULL REFERENCES generations(id),
  file_name TEXT NOT NULL,
  kind TEXT NOT NULL,
  exported_at TEXT NOT NULL
);

CREATE INDEX idx_exports_session ON exports(session_id);
CREATE INDEX idx_exports_generation ON exports(generation_id);
