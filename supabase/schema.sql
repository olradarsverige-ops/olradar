
-- Ölradar – schema + policies + seed (Helsingborg inkl.)

create table if not exists venues (
  id text primary key,
  name text not null,
  lat double precision,
  lng double precision,
  address text,
  city text,
  country text,
  open_now boolean default true
);

create table if not exists beers (
  id text primary key,
  name text not null unique,
  style text,
  abv numeric
);

create table if not exists prices (
  id text primary key,
  venue_id text references venues(id) on delete cascade,
  beer_id text references beers(id) on delete cascade,
  price_original numeric not null,
  currency text not null default 'SEK',
  price_sek numeric not null,
  rating numeric,
  user_id uuid,
  photo_url text,
  ocr_text text,
  verified boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_prices_venue_time on prices(venue_id, created_at desc);
create index if not exists idx_prices_created_at on prices(created_at desc);

drop view if exists vw_nearby;
create view vw_nearby as
select
  v.id,
  v.name,
  coalesce(v.city, 'Okänd') as city,
  coalesce(v.open_now, true) as "openNow",
  (
    select json_agg(json_build_object(
      'beer', b.name,
      'style', b.style,
      'price', p.price_sek,
      'rating', coalesce(p.rating, 0),
      'updatedAt', p.created_at
    ) order by p.created_at desc)
    from prices p
    join beers b on b.id = p.beer_id
    where p.venue_id = v.id
    limit 3
  ) as deals
from venues v;

alter table venues enable row level security;
alter table beers  enable row level security;
alter table prices enable row level security;

drop policy if exists venues_read  on venues;
drop policy if exists beers_read   on beers;
drop policy if exists prices_read  on prices;
drop policy if exists prices_insert on prices;
drop policy if exists venues_insert on venues;
drop policy if exists beers_insert  on beers;

create policy venues_read on venues for select using (true);
create policy beers_read  on beers  for select using (true);
create policy prices_read on prices for select using (true);

create policy prices_insert on prices for insert with check (true);
create policy venues_insert on venues for insert with check (true);
create policy beers_insert  on beers  for insert with check (true);

-- Seed: Stockholm, Göteborg, Malmö (som tidigare)
insert into venues (id, name, city, country, open_now) values
  ('v1', 'Bryggverket', 'Stockholm', 'SE', true),
  ('v2', 'Tapp & Ton', 'Göteborg',   'SE', true),
  ('v3', 'Surt & Sött', 'Malmö',     'SE', false)
on conflict (id) do nothing;

insert into beers (id, name, style) values
  ('b1', 'Husets Lager', 'Lager'),
  ('b2', 'Citra IPA', 'IPA'),
  ('b3', 'Pilsner Urquell', 'Pilsner'),
  ('b4', 'Oatmeal Stout', 'Stout')
on conflict (id) do nothing;

insert into prices (id, venue_id, beer_id, price_original, currency, price_sek, rating, verified) values
  ('p1', 'v1', 'b1', 49, 'SEK', 49, 4.0, true),
  ('p2', 'v1', 'b2', 72, 'SEK', 72, 4.2, false),
  ('p3', 'v2', 'b3', 58, 'SEK', 58, 4.1, false),
  ('p4', 'v3', 'b4', 69, 'SEK', 69, 4.5, true)
on conflict (id) do nothing;

-- Seed: Helsingborg
insert into venues (id, name, city, country, open_now) values
  ('hbg1', 'Helsing Pub', 'Helsingborg', 'SE', true)
on conflict (id) do nothing;

insert into beers (id, name, style) values
  ('hbg_b1', 'Hazy HBG IPA', 'IPA'),
  ('hbg_b2', 'Sundets Lager', 'Lager')
on conflict (id) do nothing;

insert into prices (id, venue_id, beer_id, price_original, currency, price_sek, rating, verified) values
  ('hbg_p1', 'hbg1', 'hbg_b1', 62, 'SEK', 62, 4.2, true),
  ('hbg_p2', 'hbg1', 'hbg_b2', 49, 'SEK', 49, 3.9, false)
on conflict (id) do nothing;
