-- Enable Realtime subscriptions from the client
-- Run AFTER schema.sql

-- Already done in schema.sql, but confirm:
ALTER PUBLICATION supabase_realtime ADD TABLE ads_library;

-- Grant anon read for realtime
GRANT SELECT ON ads_library TO anon;
GRANT SELECT ON ads_library TO authenticated;
