-- Synced copy of the Google Sheet marketing/sales data.
-- row_id is the sheet's own unique row identifier and is the upsert key
-- used by /api/sync to avoid duplicates when the sheet is re-synced.
CREATE TABLE IF NOT EXISTS marketing_rows (
  row_id TEXT PRIMARY KEY,
  row_date DATE NOT NULL,
  campaign_name TEXT NOT NULL,
  channel TEXT NOT NULL,
  budget INTEGER,
  spent INTEGER NOT NULL,
  impressions INTEGER NOT NULL,
  clicks INTEGER NOT NULL,
  leads INTEGER NOT NULL,
  meetings INTEGER NOT NULL,
  deals INTEGER NOT NULL,
  revenue INTEGER NOT NULL,
  salesperson TEXT NOT NULL,
  region TEXT,
  product TEXT NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_rows_date ON marketing_rows (row_date);
CREATE INDEX IF NOT EXISTS idx_marketing_rows_campaign ON marketing_rows (campaign_name);
CREATE INDEX IF NOT EXISTS idx_marketing_rows_channel ON marketing_rows (channel);
CREATE INDEX IF NOT EXISTS idx_marketing_rows_salesperson ON marketing_rows (salesperson);
CREATE INDEX IF NOT EXISTS idx_marketing_rows_region ON marketing_rows (region);
CREATE INDEX IF NOT EXISTS idx_marketing_rows_product ON marketing_rows (product);

CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rows_synced INTEGER,
  status TEXT NOT NULL,
  error_message TEXT
);

-- Manager-configured threshold alert rules ("bonus": שליחת התראה כאשר מדד
-- חורג מערך מסוים). Evaluated against the currently displayed (filtered)
-- metrics on the dashboard.
CREATE TABLE IF NOT EXISTS alert_rules (
  id SERIAL PRIMARY KEY,
  metric TEXT NOT NULL,      -- totalSpent | totalRevenue | roi | conversionRate | avgCostPerLead | avgCostPerDeal
  operator TEXT NOT NULL,    -- 'gt' | 'lt'
  threshold DOUBLE PRECISION NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
