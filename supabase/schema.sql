-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: wedding_info
create table if not exists public.wedding_info (
    id uuid default uuid_generate_v4() primary key,
    groom_name text not null,
    bride_name text not null,
    groom_nickname text not null,
    bride_nickname text not null,
    event_date date not null,
    event_time text not null,
    location text not null,
    address text not null,
    google_maps text not null,
    story_meet text,
    story_proposal text,
    story_marriage text,
    closing_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: gallery
create table if not exists public.gallery (
    id uuid default uuid_generate_v4() primary key,
    image_url text not null,
    sort_order integer default 0 not null
);

-- Table: parents
create table if not exists public.parents (
    id uuid default uuid_generate_v4() primary key,
    type text not null check (type in ('groom', 'bride')),
    father_name text not null,
    mother_name text not null
);

-- Table: gift_accounts
create table if not exists public.gift_accounts (
    id uuid default uuid_generate_v4() primary key,
    bank_name text not null,
    account_number text not null,
    account_holder text not null,
    qris_image text
);

-- Table: rsvp
create table if not exists public.rsvp (
    id uuid default uuid_generate_v4() primary key,
    guest_name text not null,
    attendance boolean not null,
    guest_count integer not null default 1,
    message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: guestbook
create table if not exists public.guestbook (
    id uuid default uuid_generate_v4() primary key,
    guest_name text not null,
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: guests
create table if not exists public.guests (
    id uuid default uuid_generate_v4() primary key,
    guest_name text not null,
    slug text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) policies
alter table public.wedding_info enable row level security;
alter table public.gallery enable row level security;
alter table public.parents enable row level security;
alter table public.gift_accounts enable row level security;
alter table public.rsvp enable row level security;
alter table public.guestbook enable row level security;
alter table public.guests enable row level security;

-- Policies: wedding_info
create policy "Allow public read access to wedding_info" on public.wedding_info for select using (true);
create policy "Allow admin write access to wedding_info" on public.wedding_info for all using (auth.role() = 'authenticated');

-- Policies: gallery
create policy "Allow public read access to gallery" on public.gallery for select using (true);
create policy "Allow admin write access to gallery" on public.gallery for all using (auth.role() = 'authenticated');

-- Policies: parents
create policy "Allow public read access to parents" on public.parents for select using (true);
create policy "Allow admin write access to parents" on public.parents for all using (auth.role() = 'authenticated');

-- Policies: gift_accounts
create policy "Allow public read access to gift_accounts" on public.gift_accounts for select using (true);
create policy "Allow admin write access to gift_accounts" on public.gift_accounts for all using (auth.role() = 'authenticated');

-- Policies: rsvp
create policy "Allow public read access to rsvp" on public.rsvp for select using (true);
create policy "Allow public insert access to rsvp" on public.rsvp for insert with check (true);
create policy "Allow admin write access to rsvp" on public.rsvp for all using (auth.role() = 'authenticated');

-- Policies: guestbook
create policy "Allow public read access to guestbook" on public.guestbook for select using (true);
create policy "Allow public insert access to guestbook" on public.guestbook for insert with check (true);
create policy "Allow admin write access to guestbook" on public.guestbook for all using (auth.role() = 'authenticated');

-- Policies: guests
create policy "Allow public read access to guests" on public.guests for select using (true);
create policy "Allow admin write access to guests" on public.guests for all using (auth.role() = 'authenticated');

-- Enable real-time for guestbook
begin;
  -- remove the publication if it already exists
  drop publication if exists supabase_realtime;
  -- create publication
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.guestbook;
