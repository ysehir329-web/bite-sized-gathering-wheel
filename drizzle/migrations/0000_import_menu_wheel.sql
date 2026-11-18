CREATE TABLE public.menu_categories (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  position integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.menu_categories TO anon, authenticated;
GRANT ALL ON public.menu_categories TO service_role;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view menu categories" ON public.menu_categories FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  category_id text NOT NULL REFERENCES public.menu_categories(id) ON DELETE RESTRICT,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL CHECK (price >= 0),
  old_price numeric CHECK (old_price > price),
  image text NOT NULL DEFAULT 'espresso',
  available boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view available menu items" ON public.menu_items FOR SELECT TO anon, authenticated USING (available = true);

INSERT INTO public.menu_categories (id, name, position) VALUES
  ('sicak','Sıcak Kahve',1),('soguk','Soğuk Kahve',2),('frappe','Frappuccino',3),('mocha','Mocha',4);
INSERT INTO public.menu_items (name, category_id, price, old_price, image, description, position) VALUES
  ('Espresso','sicak',65,80,'espresso','Yoğun ve aromatik',1),
  ('Flat White','sicak',140,170,'flatwhite','İpeksi süt köpüğü',2),
  ('Cappuccino','sicak',120,NULL,'flatwhite','Klasik İtalyan',3),
  ('Americano','sicak',90,NULL,'espresso','Sıcak su ve espresso',4),
  ('Iced Latte','soguk',150,NULL,'icedlatte','Buz, süt ve espresso',5),
  ('Cold Brew','soguk',160,NULL,'icedlatte','18 saat demlenmiş',6),
  ('Karamel Frappuccino','frappe',190,220,'frappe','Karamel soslu',7),
  ('Vanilya Frappuccino','frappe',180,NULL,'frappe','Kremalı vanilya',8),
  ('Mocha','mocha',160,NULL,'flatwhite','Çikolata ve espresso',9),
  ('Iced Mocha','mocha',170,NULL,'icedlatte','Buzlu çikolatalı',10);

CREATE TABLE public.menu_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT '',
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX menu_reviews_item_idx ON public.menu_reviews(item_id);
GRANT ALL ON public.menu_reviews TO service_role;
ALTER TABLE public.menu_reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.guest_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL DEFAULT '',
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.guest_comments TO anon, authenticated;
GRANT ALL ON public.guest_comments TO service_role;
ALTER TABLE public.guest_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guests send comments as unread" ON public.guest_comments FOR INSERT TO anon, authenticated
  WITH CHECK (is_read = false AND char_length(message) BETWEEN 1 AND 1000);

CREATE TABLE public.wheel_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title text NOT NULL DEFAULT '🎡 Lucky Wheel',
  subtitle text NOT NULL DEFAULT 'Spin the wheel and win a surprise prize!',
  max_spins integer NOT NULL DEFAULT 2 CHECK (max_spins >= 0),
  prizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wheel_settings TO anon, authenticated;
GRANT ALL ON public.wheel_settings TO service_role;
ALTER TABLE public.wheel_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read wheel settings" ON public.wheel_settings FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.wheel_settings (id, prizes) VALUES (1, '[
 {"t":"Free Coffee","e":"☕","c":"#8d5524","limit":1},
 {"t":"10 Birr Off","e":"💸","c":"#2f9e44","limit":null},
 {"t":"Free Juice","e":"🍹","c":"#f08c00","limit":1},
 {"t":"50 Birr Off","e":"💰","c":"#1c7ed6","limit":3},
 {"t":"Free Dessert","e":"🍰","c":"#d6336c","limit":1},
 {"t":"100 Birr Off","e":"🎁","c":"#7048e8","limit":1},
 {"t":"Free Tea","e":"🫖","c":"#0b7285","limit":2},
 {"t":"20 Birr Off","e":"💵","c":"#e8590c","limit":null},
 {"t":"Maybe Next Time","e":"😊","c":"#868e96","limit":null,"x":true}
]'::jsonb);

CREATE TABLE public.wheel_wins (
  day date NOT NULL,
  prize text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, prize)
);
GRANT ALL ON public.wheel_wins TO service_role;
ALTER TABLE public.wheel_wins ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.wheel_spins (
  device_id text NOT NULL CHECK (char_length(device_id) BETWEEN 32 AND 128),
  day date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (device_id, day)
);
GRANT ALL ON public.wheel_spins TO service_role;
ALTER TABLE public.wheel_spins ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.wheel_ip_spins (
  ip_hash text NOT NULL,
  hour timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, hour)
);
GRANT ALL ON public.wheel_ip_spins TO service_role;
ALTER TABLE public.wheel_ip_spins ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.wheel_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  prize text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  redeemed_at timestamptz
);
GRANT ALL ON public.wheel_claims TO service_role;
ALTER TABLE public.wheel_claims ENABLE ROW LEVEL SECURITY;
CREATE INDEX wheel_claims_created_at_idx ON public.wheel_claims (created_at DESC);

CREATE TABLE public.admin_pin_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_pin_attempts TO service_role;
ALTER TABLE public.admin_pin_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX admin_pin_attempts_ip_idx ON public.admin_pin_attempts (ip_hash, created_at);

CREATE OR REPLACE FUNCTION public.spin_wheel()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prizes jsonb;
  v_today date := (now() AT TIME ZONE 'Europe/Istanbul')::date;
  v_ok integer[] := '{}';
  v_idx integer;
  v_prize jsonb;
  v_limit integer;
  v_won integer;
  i integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('spin_wheel'));
  SELECT prizes INTO v_prizes FROM public.wheel_settings WHERE id = 1;
  IF v_prizes IS NULL OR jsonb_array_length(v_prizes) = 0 THEN
    RETURN NULL;
  END IF;
  FOR i IN 0 .. jsonb_array_length(v_prizes) - 1 LOOP
    v_prize := v_prizes -> i;
    IF v_prize ->> 'limit' IS NULL THEN
      v_ok := v_ok || i;
    ELSE
      v_limit := (v_prize ->> 'limit')::integer;
      SELECT count INTO v_won FROM public.wheel_wins WHERE day = v_today AND prize = v_prize ->> 't';
      IF v_limit - COALESCE(v_won, 0) > 0 THEN
        v_ok := v_ok || i;
      END IF;
    END IF;
  END LOOP;
  IF array_length(v_ok, 1) IS NULL THEN
    FOR i IN 0 .. jsonb_array_length(v_prizes) - 1 LOOP
      IF COALESCE((v_prizes -> i ->> 'x')::boolean, false) THEN v_ok := ARRAY[i]; END IF;
    END LOOP;
    IF array_length(v_ok, 1) IS NULL THEN v_ok := ARRAY[0]; END IF;
  END IF;
  v_idx := v_ok[1 + floor(random() * array_length(v_ok, 1))::integer];
  INSERT INTO public.wheel_wins (day, prize, count) VALUES (v_today, v_prizes -> v_idx ->> 't', 1)
    ON CONFLICT (day, prize) DO UPDATE SET count = public.wheel_wins.count + 1;
  RETURN v_idx;
END;
$$;
REVOKE ALL ON FUNCTION public.spin_wheel() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spin_wheel() TO service_role;

CREATE OR REPLACE FUNCTION public.spin_wheel_guest(p_device text, p_ip text, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'Europe/Istanbul')::date;
  v_hour timestamptz := date_trunc('hour', now());
  v_max integer;
  v_used integer;
  v_ip integer;
  v_idx integer;
  v_prize jsonb;
  v_code text := NULL;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('wheel_device:' || p_device));
  SELECT max_spins INTO v_max FROM public.wheel_settings WHERE id = 1;
  SELECT count INTO v_used FROM public.wheel_spins WHERE device_id = p_device AND day = v_today;
  v_used := COALESCE(v_used, 0);
  IF COALESCE(v_max, 0) > 0 AND v_used >= v_max THEN
    RETURN jsonb_build_object('status', 'device_limit', 'used', v_used);
  END IF;
  SELECT count INTO v_ip FROM public.wheel_ip_spins WHERE ip_hash = p_ip AND hour = v_hour;
  IF COALESCE(v_ip, 0) >= 60 THEN
    RETURN jsonb_build_object('status', 'ip_limit', 'used', v_used);
  END IF;
  v_idx := public.spin_wheel();
  IF v_idx IS NULL THEN
    RETURN jsonb_build_object('status', 'unavailable');
  END IF;
  SELECT prizes -> v_idx INTO v_prize FROM public.wheel_settings WHERE id = 1;
  INSERT INTO public.wheel_ip_spins (ip_hash, hour, count) VALUES (p_ip, v_hour, 1)
    ON CONFLICT (ip_hash, hour) DO UPDATE SET count = public.wheel_ip_spins.count + 1;
  INSERT INTO public.wheel_spins (device_id, day, count) VALUES (p_device, v_today, 1)
    ON CONFLICT (device_id, day) DO UPDATE SET count = public.wheel_spins.count + 1;
  DELETE FROM public.wheel_ip_spins WHERE hour < now() - interval '2 days';
  IF NOT COALESCE((v_prize ->> 'x')::boolean, false) THEN
    INSERT INTO public.wheel_claims (code, prize, expires_at)
      VALUES (p_code, v_prize ->> 't', ((v_today + 1)::timestamp AT TIME ZONE 'Europe/Istanbul'));
    v_code := p_code;
  END IF;
  RETURN jsonb_build_object('status', 'ok', 'index', v_idx, 'code', v_code, 'used', v_used + 1);
END;
$$;
REVOKE ALL ON FUNCTION public.spin_wheel_guest(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spin_wheel_guest(text, text, text) TO service_role;