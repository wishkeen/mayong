-- Cached responses from the previous translation provider must not be mixed
-- with results from the newly deployed open-source translation models.
truncate table public.translation_cache;
