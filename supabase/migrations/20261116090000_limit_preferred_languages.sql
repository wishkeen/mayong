update public.profiles
set preferred_language = 'en'
where preferred_language is not null
  and preferred_language not in ('en', 'bn', 'hi');

alter table public.profiles
  add constraint profiles_preferred_language_supported
  check (preferred_language is null or preferred_language in ('en', 'bn', 'hi'));
