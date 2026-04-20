-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null,
  avatar_url text,
  theme text default 'light' check (theme in ('light', 'dark', 'system')),
  font_size text default 'medium' check (font_size in ('small', 'medium', 'large')),
  default_note_color text default '#ffffff',
  default_view text default 'grid' check (default_view in ('grid', 'list')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- LABELS
-- ============================================================
create table public.labels (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text default '#6366f1',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, name)
);

-- ============================================================
-- NOTES
-- ============================================================
create table public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text default '',
  content text default '',
  color text default '#ffffff',
  is_pinned boolean default false,
  pinned_at timestamptz,
  password_hash text,
  yjs_state bytea,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_notes_user_id on public.notes(user_id);
create index idx_notes_updated_at on public.notes(updated_at desc);
create index idx_notes_pinned on public.notes(is_pinned, pinned_at desc);
create index idx_notes_search on public.notes
  using gin(to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));

-- ============================================================
-- NOTE_LABELS
-- ============================================================
create table public.note_labels (
  note_id uuid not null references public.notes(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (note_id, label_id)
);

-- ============================================================
-- NOTE_ATTACHMENTS
-- ============================================================
create table public.note_attachments (
  id uuid primary key default uuid_generate_v4(),
  note_id uuid not null references public.notes(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_size bigint,
  mime_type text,
  created_at timestamptz default now()
);

create index idx_attachments_note_id on public.note_attachments(note_id);

-- ============================================================
-- NOTE_SHARES
-- ============================================================
create table public.note_shares (
  id uuid primary key default uuid_generate_v4(),
  note_id uuid not null references public.notes(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  permission text not null check (permission in ('read', 'edit')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (note_id, recipient_id)
);

create index idx_shares_recipient on public.note_shares(recipient_id);
create index idx_shares_note on public.note_shares(note_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

-- ============================================================
-- PASSWORD_RESET_OTPS
-- ============================================================
create table public.password_reset_otps (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  otp_code text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);

create index idx_otps_email on public.password_reset_otps(email, used);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.labels enable row level security;
alter table public.notes enable row level security;
alter table public.note_labels enable row level security;
alter table public.note_attachments enable row level security;
alter table public.note_shares enable row level security;
alter table public.notifications enable row level security;

-- PROFILES
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- LABELS
create policy "Users can view own labels" on public.labels for select using (auth.uid() = user_id);
create policy "Users can insert own labels" on public.labels for insert with check (auth.uid() = user_id);
create policy "Users can update own labels" on public.labels for update using (auth.uid() = user_id);
create policy "Users can delete own labels" on public.labels for delete using (auth.uid() = user_id);

-- NOTES
create policy "Users can view own or shared notes" on public.notes for select
  using (auth.uid() = user_id or exists (
    select 1 from public.note_shares where note_shares.note_id = notes.id and note_shares.recipient_id = auth.uid()
  ));
create policy "Users can insert own notes" on public.notes for insert with check (auth.uid() = user_id);
create policy "Users and edit-shared can update notes" on public.notes for update
  using (auth.uid() = user_id or exists (
    select 1 from public.note_shares where note_shares.note_id = notes.id
    and note_shares.recipient_id = auth.uid() and note_shares.permission = 'edit'
  ));
create policy "Only owner can delete notes" on public.notes for delete using (auth.uid() = user_id);

-- NOTE_LABELS
create policy "Users can view note_labels for accessible notes" on public.note_labels for select
  using (exists (select 1 from public.notes where notes.id = note_labels.note_id
    and (notes.user_id = auth.uid() or exists (
      select 1 from public.note_shares where note_shares.note_id = notes.id and note_shares.recipient_id = auth.uid()
    ))));
create policy "Users can manage note_labels on own notes" on public.note_labels for all
  using (exists (select 1 from public.notes where notes.id = note_labels.note_id and notes.user_id = auth.uid()));

-- NOTE_ATTACHMENTS
create policy "Users can view attachments of accessible notes" on public.note_attachments for select
  using (exists (select 1 from public.notes where notes.id = note_attachments.note_id
    and (notes.user_id = auth.uid() or exists (
      select 1 from public.note_shares where note_shares.note_id = notes.id and note_shares.recipient_id = auth.uid()
    ))));
create policy "Users can manage attachments on own notes" on public.note_attachments for all
  using (exists (select 1 from public.notes where notes.id = note_attachments.note_id and notes.user_id = auth.uid()));

-- NOTE_SHARES
create policy "Owner and recipient can view shares" on public.note_shares for select
  using (auth.uid() = owner_id or auth.uid() = recipient_id);
create policy "Only owner can create shares" on public.note_shares for insert with check (auth.uid() = owner_id);
create policy "Only owner can update shares" on public.note_shares for update using (auth.uid() = owner_id);
create policy "Only owner can delete shares" on public.note_shares for delete using (auth.uid() = owner_id);

-- NOTIFICATIONS
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_labels_updated before update on public.labels for each row execute function public.set_updated_at();
create trigger trg_notes_updated before update on public.notes for each row execute function public.set_updated_at();
create trigger trg_shares_updated before update on public.note_shares for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_note_pin()
returns trigger as $$
begin
  if new.is_pinned = true and (old.is_pinned is distinct from true) then
    new.pinned_at = now();
  elsif new.is_pinned = false then
    new.pinned_at = null;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_notes_pin before update on public.notes for each row execute function public.handle_note_pin();

create or replace function public.find_user_by_email(search_email text)
returns table(id uuid, email text, display_name text, avatar_url text)
language plpgsql security definer as $$
begin
  return query
  select p.id, p.email, p.display_name, p.avatar_url
  from public.profiles p
  where lower(p.email) = lower(search_email)
  and p.id != auth.uid();
end;
$$;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values ('note-attachments', 'note-attachments', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;

create policy "Users can upload to their own note folders" on storage.objects for insert
  with check (bucket_id = 'note-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view attachments they have access to" on storage.objects for select
  using (bucket_id = 'note-attachments' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.note_attachments na
      join public.note_shares ns on ns.note_id = na.note_id
      where na.storage_path = name and ns.recipient_id = auth.uid()
    )
  ));

create policy "Users can delete their own attachments" on storage.objects for delete
  using (bucket_id = 'note-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Avatars are publicly viewable" on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
