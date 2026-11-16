CREATE TABLE public.kiosk_staff (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  pin_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.kiosk_staff TO service_role;
ALTER TABLE public.kiosk_staff ENABLE ROW LEVEL SECURITY;

INSERT INTO public.kiosk_staff (id, pin_hash)
VALUES (1, encode(extensions.digest('airavoto-pin:1234', 'sha256'), 'hex'));