DELETE FROM public.patient_documents WHERE uploaded_by IN (SELECT user_id FROM public.user_roles WHERE role='admin');
DELETE FROM auth.users WHERE id IN (SELECT user_id FROM public.user_roles WHERE role='admin');
