-- Soporte de varias cuentas de correo en la misma bandeja (Lorena tiene dos
-- buzones: hola@ortegacarrion.es y lorenaortega@lorenaortega.es). Cada correo
-- se etiqueta con la cuenta a la que pertenece; los UID de IMAP son por buzón,
-- así que la unicidad pasa a ser (account, folder, uid).
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS account text NOT NULL DEFAULT '';

DROP INDEX IF EXISTS emails_folder_uid_uidx;
CREATE UNIQUE INDEX IF NOT EXISTS emails_acct_folder_uid_uidx ON public.emails (account, folder, uid);
CREATE INDEX IF NOT EXISTS emails_account_idx ON public.emails (account);
