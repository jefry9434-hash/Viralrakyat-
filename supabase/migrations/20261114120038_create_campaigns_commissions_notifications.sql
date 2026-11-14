/*
# Campaigns, promotions, commissions, and notifications

1. New Tables
- `campaigns`: promotion campaigns created by admins. Active campaigns can be joined by promoters.
- `promotions`: a promoter joining a campaign. Each promotion has a unique tracking code.
- `commissions`: earnings (in rupiah) recorded by an admin for a promotion. Pending until approved; approved amounts form the promoter's balance.
- `notifications`: in-app messages for each user. Created automatically when a video is reviewed or a commission is recorded or approved.

2. Functions and triggers
- `notify_video_review()`: notifies a creator when their video is approved or rejected.
- `notify_commission()`: notifies a promoter when a commission is recorded or approved.

3. Security
- Row level security enabled on all four tables.
- Signed-in users can read active and closed campaigns; only admins create or change campaigns.
- Only promoters can join an active campaign, and only for themselves.
- Promoters see their own promotions, commissions, and notifications; admins see all of them.
- Only admins record commissions (for an existing promotion of the same promoter) and approve them.
- Users can mark their own notifications as read; no user can create notifications directly.

4. Important notes
- Commission amounts are whole rupiah (bigint, must be greater than zero).
*/

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  reward_info text NOT NULL DEFAULT '' CHECK (char_length(reward_info) <= 500),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  promoter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  tracking_code text NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, promoter_id)
);

CREATE INDEX IF NOT EXISTS promotions_promoter_id_idx ON promotions (promoter_id);

CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  promoter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount bigint NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS commissions_promoter_id_idx ON commissions (promoter_id);
CREATE INDEX IF NOT EXISTS commissions_promotion_id_idx ON commissions (promotion_id);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) <= 120),
  body text NOT NULL DEFAULT '' CHECK (char_length(body) <= 500),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications (user_id);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON campaigns TO authenticated;
GRANT INSERT (title, description, reward_info) ON campaigns TO authenticated;
GRANT UPDATE (status) ON campaigns TO authenticated;

GRANT SELECT ON promotions TO authenticated;
GRANT INSERT (campaign_id) ON promotions TO authenticated;

GRANT SELECT ON commissions TO authenticated;
GRANT INSERT (promotion_id, promoter_id, amount) ON commissions TO authenticated;
GRANT UPDATE (status) ON commissions TO authenticated;

GRANT SELECT ON notifications TO authenticated;
GRANT UPDATE (is_read) ON notifications TO authenticated;

DROP POLICY IF EXISTS "campaigns_select_signed_in" ON campaigns;
CREATE POLICY "campaigns_select_signed_in" ON campaigns FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "campaigns_insert_admin" ON campaigns;
CREATE POLICY "campaigns_insert_admin" ON campaigns FOR INSERT
TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "campaigns_update_admin" ON campaigns;
CREATE POLICY "campaigns_update_admin" ON campaigns FOR UPDATE
TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "promotions_select_own" ON promotions;
CREATE POLICY "promotions_select_own" ON promotions FOR SELECT
TO authenticated USING (promoter_id = auth.uid());

DROP POLICY IF EXISTS "promotions_select_admin" ON promotions;
CREATE POLICY "promotions_select_admin" ON promotions FOR SELECT
TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "promotions_insert_promoter" ON promotions;
CREATE POLICY "promotions_insert_promoter" ON promotions FOR INSERT
TO authenticated
WITH CHECK (
  promoter_id = auth.uid()
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'promoter')
  AND EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = campaign_id AND campaigns.status = 'active')
);

DROP POLICY IF EXISTS "commissions_select_own" ON commissions;
CREATE POLICY "commissions_select_own" ON commissions FOR SELECT
TO authenticated USING (promoter_id = auth.uid());

DROP POLICY IF EXISTS "commissions_select_admin" ON commissions;
CREATE POLICY "commissions_select_admin" ON commissions FOR SELECT
TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "commissions_insert_admin" ON commissions;
CREATE POLICY "commissions_insert_admin" ON commissions FOR INSERT
TO authenticated
WITH CHECK (
  is_admin()
  AND EXISTS (
    SELECT 1 FROM promotions
    WHERE promotions.id = commissions.promotion_id
      AND promotions.promoter_id = commissions.promoter_id
  )
);

DROP POLICY IF EXISTS "commissions_update_admin" ON commissions;
CREATE POLICY "commissions_update_admin" ON commissions FOR UPDATE
TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION notify_video_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO notifications (user_id, title, body)
    VALUES (
      NEW.owner_id,
      CASE WHEN NEW.status = 'approved' THEN 'Video disetujui' ELSE 'Video ditolak' END,
      CASE
        WHEN NEW.status = 'approved' THEN 'Video "' || NEW.title || '" sudah tayang dan bisa dipromosikan.'
        ELSE 'Video "' || NEW.title || '" belum memenuhi ketentuan. Silakan unggah ulang.'
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION notify_video_review() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_video_reviewed ON videos;
CREATE TRIGGER on_video_reviewed
AFTER UPDATE OF status ON videos
FOR EACH ROW EXECUTE FUNCTION notify_video_review();

CREATE OR REPLACE FUNCTION notify_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, title, body)
    VALUES (
      NEW.promoter_id,
      'Komisi baru',
      'Komisi sebesar Rp ' || to_char(NEW.amount, 'FM999,999,999,990') || ' sedang menunggu persetujuan.'
    );
  ELSIF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    INSERT INTO notifications (user_id, title, body)
    VALUES (
      NEW.promoter_id,
      'Komisi disetujui',
      'Komisi sebesar Rp ' || to_char(NEW.amount, 'FM999,999,999,990') || ' sudah masuk ke saldo Anda.'
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION notify_commission() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_commission_recorded ON commissions;
CREATE TRIGGER on_commission_recorded
AFTER INSERT OR UPDATE OF status ON commissions
FOR EACH ROW EXECUTE FUNCTION notify_commission();
