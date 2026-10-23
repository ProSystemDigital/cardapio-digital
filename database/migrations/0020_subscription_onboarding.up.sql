BEGIN;

CREATE TABLE subscription_onboarding_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer text NOT NULL CHECK (char_length(issuer) BETWEEN 1 AND 2048),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 255),
  plan_key text NOT NULL CHECK (plan_key IN ('essential', 'professional')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'past_due', 'canceled')),
  stripe_checkout_session_id text UNIQUE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  principal_id uuid REFERENCES principals (id) ON DELETE RESTRICT,
  tenant_id uuid REFERENCES tenants (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer, subject),
  CHECK ((principal_id IS NULL) = (tenant_id IS NULL))
);

CREATE TABLE subscription_webhook_events (
  stripe_event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscription_onboarding_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_onboarding_intents FORCE ROW LEVEL SECURITY;
ALTER TABLE subscription_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_webhook_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON subscription_onboarding_intents, subscription_webhook_events FROM PUBLIC;

CREATE FUNCTION public.create_subscription_onboarding(
  requested_issuer text,
  requested_subject text,
  requested_plan_key text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE onboarding_id uuid;
BEGIN
  IF requested_plan_key NOT IN ('essential', 'professional')
     OR char_length(requested_issuer) NOT BETWEEN 1 AND 2048
     OR char_length(requested_subject) NOT BETWEEN 1 AND 255 THEN
    RAISE EXCEPTION 'invalid subscription onboarding';
  END IF;

  INSERT INTO public.subscription_onboarding_intents (issuer, subject, plan_key)
  VALUES (requested_issuer, requested_subject, requested_plan_key)
  ON CONFLICT (issuer, subject) DO UPDATE
    SET plan_key = EXCLUDED.plan_key,
        updated_at = now()
    WHERE subscription_onboarding_intents.status <> 'active'
  RETURNING id INTO onboarding_id;

  IF onboarding_id IS NULL THEN
    RAISE EXCEPTION 'active subscription already exists';
  END IF;
  RETURN onboarding_id;
END;
$$;

CREATE FUNCTION public.resume_subscription_access(
  requested_event_id text,
  requested_event_type text,
  requested_subscription_id text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE affected_principal_id uuid;
BEGIN
  INSERT INTO public.subscription_webhook_events (stripe_event_id, event_type)
  VALUES (requested_event_id, requested_event_type) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.subscription_onboarding_intents
     SET status = 'active', updated_at = now()
   WHERE stripe_subscription_id = requested_subscription_id
   RETURNING principal_id INTO affected_principal_id;
  IF affected_principal_id IS NOT NULL THEN
    UPDATE public.principals SET status = 'active', disabled_at = NULL WHERE id = affected_principal_id;
  END IF;
  RETURN true;
END;
$$;

CREATE FUNCTION public.attach_subscription_checkout(
  requested_onboarding_id uuid,
  requested_checkout_session_id text
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  UPDATE public.subscription_onboarding_intents
     SET stripe_checkout_session_id = requested_checkout_session_id,
         updated_at = now()
   WHERE id = requested_onboarding_id
     AND status = 'pending'
$$;

CREATE FUNCTION public.activate_paid_subscription(
  requested_event_id text,
  requested_event_type text,
  requested_checkout_session_id text,
  requested_customer_id text,
  requested_subscription_id text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE intent public.subscription_onboarding_intents%ROWTYPE;
DECLARE new_principal_id uuid;
DECLARE new_tenant_id uuid;
BEGIN
  INSERT INTO public.subscription_webhook_events (stripe_event_id, event_type)
  VALUES (requested_event_id, requested_event_type)
  ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;

  SELECT * INTO intent FROM public.subscription_onboarding_intents
   WHERE stripe_checkout_session_id = requested_checkout_session_id
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'subscription onboarding not found'; END IF;

  IF intent.principal_id IS NULL THEN
    INSERT INTO public.principals (status) VALUES ('active') RETURNING id INTO new_principal_id;
    INSERT INTO public.tenants (slug, display_name, short_name, tagline, order_channel, payment_timing)
    VALUES ('estabelecimento-' || left(replace(gen_random_uuid()::text, '-', ''), 12), 'Novo estabelecimento', 'Novo estabelecimento', 'Configure seu cardápio', 'whatsapp', 'on_fulfillment')
    RETURNING id INTO new_tenant_id;
    INSERT INTO public.tenant_branding (tenant_id, primary_color, secondary_color, accent_color)
    VALUES (new_tenant_id, '#174b36', '#f4f0e6', '#d8a243');
    INSERT INTO public.tenant_operations (tenant_id, minimum_order_in_cents, delivery_fee_in_cents)
    VALUES (new_tenant_id, 0, 0);
    INSERT INTO public.tenant_fulfillment_modes (tenant_id, mode)
    VALUES (new_tenant_id, 'pickup'), (new_tenant_id, 'delivery'), (new_tenant_id, 'dine_in');
    INSERT INTO public.external_identity_links (issuer, subject, principal_id, status)
    VALUES (intent.issuer, intent.subject, new_principal_id, 'active');
    INSERT INTO public.tenant_memberships (tenant_id, principal_id, role, status, granted_by)
    VALUES (new_tenant_id, new_principal_id, 'owner', 'active', new_principal_id);
  ELSE
    new_principal_id := intent.principal_id;
    new_tenant_id := intent.tenant_id;
    UPDATE public.principals SET status = 'active', disabled_at = NULL WHERE id = new_principal_id;
  END IF;

  UPDATE public.subscription_onboarding_intents
     SET status = 'active', stripe_customer_id = requested_customer_id,
         stripe_subscription_id = requested_subscription_id,
         principal_id = new_principal_id, tenant_id = new_tenant_id, updated_at = now()
   WHERE id = intent.id;
  RETURN true;
END;
$$;

CREATE FUNCTION public.suspend_subscription_access(
  requested_event_id text,
  requested_event_type text,
  requested_subscription_id text,
  requested_status text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE affected_principal_id uuid;
BEGIN
  IF requested_status NOT IN ('past_due', 'canceled') THEN RAISE EXCEPTION 'invalid subscription status'; END IF;
  INSERT INTO public.subscription_webhook_events (stripe_event_id, event_type)
  VALUES (requested_event_id, requested_event_type) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.subscription_onboarding_intents
     SET status = requested_status, updated_at = now()
   WHERE stripe_subscription_id = requested_subscription_id
   RETURNING principal_id INTO affected_principal_id;
  IF affected_principal_id IS NOT NULL THEN
    UPDATE public.principals SET status = 'disabled', disabled_at = now() WHERE id = affected_principal_id;
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.create_subscription_onboarding(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.attach_subscription_checkout(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_paid_subscription(text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.suspend_subscription_access(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resume_subscription_access(text, text, text) FROM PUBLIC;
COMMIT;
