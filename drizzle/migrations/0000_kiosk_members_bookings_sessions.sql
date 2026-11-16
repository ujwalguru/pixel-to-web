CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.members TO service_role;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX members_name_lower_idx ON public.members (lower(name));
CREATE UNIQUE INDEX members_username_lower_idx ON public.members (lower(username));

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  member_name text NOT NULL,
  duration_seconds integer NOT NULL CHECK (duration_seconds > 0),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.pc_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pc_id text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('member','upbooking','username','qr')),
  player_name text NOT NULL,
  duration_seconds integer NOT NULL CHECK (duration_seconds > 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.pc_sessions TO service_role;
ALTER TABLE public.pc_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX pc_sessions_pc_idx ON public.pc_sessions (pc_id, ends_at DESC);

CREATE TABLE public.qr_pairings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  pc_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.qr_pairings TO service_role;
ALTER TABLE public.qr_pairings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.members (name, username) VALUES
  ('Rahul', 'rahul'),
  ('Priya', 'priya'),
  ('Arjun', 'arjun_gamer');

INSERT INTO public.bookings (code, member_name, duration_seconds) VALUES
  ('AIR-1001', 'Rahul', 7200),
  ('AIR-1002', 'Priya', 3600);