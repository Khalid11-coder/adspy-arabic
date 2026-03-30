-- RPC function: mark ads as inactive if not seen in X days
-- Run in Supabase SQL Editor after creating the main schema

CREATE OR REPLACE FUNCTION mark_inactive_ads(cutoff_days INT DEFAULT 7)
RETURNS INT AS $$
DECLARE rows_updated INT;
BEGIN
  UPDATE ads_library
  SET    status = 'غير نشط', updated_at = NOW()
  WHERE  last_seen_at < NOW() - (cutoff_days || ' days')::INTERVAL
    AND  status = 'نشط';

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
