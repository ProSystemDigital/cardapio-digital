BEGIN;
DROP FUNCTION IF EXISTS public.resume_subscription_access(text, text, text);
DROP FUNCTION IF EXISTS public.suspend_subscription_access(text, text, text, text);
DROP FUNCTION IF EXISTS public.activate_paid_subscription(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.attach_subscription_checkout(uuid, text);
DROP FUNCTION IF EXISTS public.create_subscription_onboarding(text, text, text);
DROP TABLE IF EXISTS subscription_webhook_events;
DROP TABLE IF EXISTS subscription_onboarding_intents;
COMMIT;
