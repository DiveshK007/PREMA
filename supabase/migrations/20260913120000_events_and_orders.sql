-- PREMA — event sink and astrologer-review order ledger
--
-- Both tables are written ONLY by the server with the secret key. Neither has
-- an anonymous-insert policy: a public, unauthenticated, unrate-limited write
-- endpoint whose contents are the primary success metric is trivially
-- forgeable, including by an accidental crawler.
--
-- RLS is enabled with NO permissive policies, so the anon and authenticated
-- roles can do nothing at all here. The service role bypasses RLS by design.

-- ---------------------------------------------------------------------------
-- EVENTS — the experiment's instrumentation
-- ---------------------------------------------------------------------------
-- Carries coarse, non-identifying context only. Never a person's name, date of
-- birth or birth time. `city` is the coarsest useful dimension and is also what
-- tells us which cities the bundled dataset is missing.
CREATE TABLE public.events (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  city        TEXT,
  detail      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT events_name_known CHECK (name IN (
    'report_generated',
    'share_clicked',
    'share_completed',
    'share_unavailable',
    'pandit_clicked',
    'optin_checked',
    'pay_clicked',
    'pay_completed',
    'geocode_miss',
    'birthtime_missing'
  ))
);

CREATE INDEX events_name_created_idx ON public.events (name, created_at DESC);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies. Server-side writes only.

COMMENT ON TABLE public.events IS
  'Experiment instrumentation. share_completed is the primary metric, NOT '
  'share_clicked — a user can open the share sheet and back out, and a '
  'click-based metric would count that as a forward.';


-- ---------------------------------------------------------------------------
-- REVIEW ORDERS — the paid astrologer review
-- ---------------------------------------------------------------------------
-- Fulfilment is manual: a practising astrologer reads both charts and we send
-- the signed report by email. The ledger exists so an order CANNOT silently
-- disappear into an inbox.
--
-- `chart_params` holds the URL-encoded birth pair. This DOES contain both
-- people's birth details, including the second person's. That is lawful and
-- expected here in a way that harvesting would not be: the customer asked us to
-- review these two specific charts, so the data is the order. The privacy page
-- says so in plain words, and the retention rule below is enforced, not implied.
CREATE TABLE public.review_orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Idempotency. Payment providers retry webhooks on timeouts, on non-2xx
  -- responses, and sometimes for no reason at all. Without this constraint a
  -- retry writes a duplicate order and we either fulfil twice (paying a pandit
  -- twice for one sale) or cannot tell which row is real.
  --
  -- The database enforces it, so no handler bug can create a duplicate. The
  -- handler must return 2xx on the duplicate path or the provider retries forever.
  provider_event_id TEXT NOT NULL UNIQUE,

  provider          TEXT NOT NULL,
  amount_minor      INTEGER NOT NULL CHECK (amount_minor > 0),
  currency          TEXT NOT NULL DEFAULT 'INR',

  customer_email    TEXT NOT NULL,
  chart_params      TEXT NOT NULL,
  guna_total        NUMERIC(4,1),

  status            TEXT NOT NULL DEFAULT 'paid'
                    CHECK (status IN ('paid', 'in_review', 'delivered', 'refunded')),

  -- The promise on the page is 3 working days. Storing it makes the promise
  -- something we can measure ourselves against rather than merely assert.
  due_at            TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  refunded_at       TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX review_orders_status_due_idx
  ON public.review_orders (status, due_at)
  WHERE status IN ('paid', 'in_review');

ALTER TABLE public.review_orders ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies. Server-side writes only, service role reads.

COMMENT ON COLUMN public.review_orders.provider_event_id IS
  'UNIQUE. Idempotency key for webhook retries. Return 2xx on conflict.';
COMMENT ON COLUMN public.review_orders.chart_params IS
  'URL-encoded birth pair. Contains BOTH people''s birth details because '
  'fulfilling the order requires them. Purge on delivery + 90 days.';


-- ---------------------------------------------------------------------------
-- RETENTION — enforced, not implied
-- ---------------------------------------------------------------------------
-- Birth details are kept only as long as fulfilment and a refund window need
-- them. Run from a scheduled job; it is idempotent and safe to re-run.
CREATE OR REPLACE FUNCTION public.purge_delivered_order_charts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  purged INTEGER;
BEGIN
  UPDATE public.review_orders
     SET chart_params = '',
         updated_at   = NOW()
   WHERE status = 'delivered'
     AND delivered_at < NOW() - INTERVAL '90 days'
     AND chart_params <> '';
  GET DIAGNOSTICS purged = ROW_COUNT;
  RETURN purged;
END;
$$;

COMMENT ON FUNCTION public.purge_delivered_order_charts() IS
  'Clears birth details from delivered orders after 90 days. The order row '
  'survives for accounting; the personal data does not.';
