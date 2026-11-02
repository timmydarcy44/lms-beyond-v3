-- EDGE Lab porte des membres de démonstration : il sort des totaux clients.
update public.organizations
set kind = 'demo',
    status = 'demo',
    client_since = null
where slug = 'edge-lab'
  and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'kind'
  );
