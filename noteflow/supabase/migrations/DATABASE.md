# 🗄️ Database Schema (Supabase / PostgreSQL)

## Overview

All tables use UUID primary keys and include `created_at` / `updated_at` timestamps. Row Level Security (RLS) is enabled on all tables.

## Migration SQL

Save this as `supabase/migrations/0001_initial_schema.sql`:

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null,
  avatar_url text,
  -- Preferences
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
  content text default '', -- HTML from TipTap
  color text default '#ffffff',
  is_pinned boolean default false,
  pinned_at timestamptz,
  -- Password protection
  password_hash text, -- bcrypt hash, null = no password
  -- For real-time collab (Yjs state)
  yjs_state bytea,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_notes_user_id on public.notes(user_id);
create index idx_notes_updated_at on public.notes(updated_at desc);
create index idx_notes_pinned on public.notes(is_pinned, pinned_at desc);

-- Full-text search index
create index idx_notes_search on public.notes 
  using gin(to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));

-- ============================================================
-- NOTE_LABELS (many-to-many)
-- ============================================================
create table public.note_labels (
  note_id uuid not null references public.notes(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (note_id, label_id)
);

-- ============================================================
-- NOTE_ATTACHMENTS (images/files)
-- ============================================================
create table public.note_attachments (
  id uuid primary key default uuid_generate_v4(),
  note_id uuid not null references public.notes(id) on delete cascade,
  storage_path text not null, -- Path in Supabase Storage
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
-- NOTIFICATIONS (for share notifications, etc.)
-- ============================================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, -- 'note_shared', 'note_unshared', etc.
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
  otp_code text not null, -- 6-digit code
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

-- PROFILES: users can read all profiles (for share email validation), update only own
create policy "Profiles are viewable by authenticated users" 
  on public.profiles for select 
  using (auth.role() = 'authenticated');

create policy "Users can insert own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- LABELS: users only see/modify their own
create policy "Users can view own labels" 
  on public.labels for select 
  using (auth.uid() = user_id);

create policy "Users can insert own labels" 
  on public.labels for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own labels" 
  on public.labels for update 
  using (auth.uid() = user_id);

create policy "Users can delete own labels" 
  on public.labels for delete 
  using (auth.uid() = user_id);

-- NOTES: owner + shared recipients can view; only owner+edit-shared can update
create policy "Users can view own or shared notes"
  on public.notes for select
  using (
    auth.uid() = user_id 
    or exists (
      select 1 from public.note_shares 
      where note_shares.note_id = notes.id 
      and note_shares.recipient_id = auth.uid()
    )
  );

create policy "Users can insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users and edit-shared can update notes"
  on public.notes for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.note_shares
      where note_shares.note_id = notes.id
      and note_shares.recipient_id = auth.uid()
      and note_shares.permission = 'edit'
    )
  );

create policy "Only owner can delete notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- NOTE_LABELS: align with note access
create policy "Users can view note_labels for accessible notes"
  on public.note_labels for select
  using (
    exists (
      select 1 from public.notes
      where notes.id = note_labels.note_id
      and (
        notes.user_id = auth.uid()
        or exists (
          select 1 from public.note_shares
          where note_shares.note_id = notes.id
          and note_shares.recipient_id = auth.uid()
        )
      )
    )
  );

create policy "Users can manage note_labels on own notes"
  on public.note_labels for all
  using (
    exists (
      select 1 from public.notes
      where notes.id = note_labels.note_id
      and notes.user_id = auth.uid()
    )
  );

-- NOTE_ATTACHMENTS
create policy "Users can view attachments of accessible notes"
  on public.note_attachments for select
  using (
    exists (
      select 1 from public.notes
      where notes.id = note_attachments.note_id
      and (
        notes.user_id = auth.uid()
        or exists (
          select 1 from public.note_shares
          where note_shares.note_id = notes.id
          and note_shares.recipient_id = auth.uid()
        )
      )
    )
  );

create policy "Users can manage attachments on own notes"
  on public.note_attachments for all
  using (
    exists (
      select 1 from public.notes
      where notes.id = note_attachments.note_id
      and notes.user_id = auth.uid()
    )
  );

-- NOTE_SHARES
create policy "Owner and recipient can view shares"
  on public.note_shares for select
  using (auth.uid() = owner_id or auth.uid() = recipient_id);

create policy "Only owner can create shares"
  on public.note_shares for insert
  with check (auth.uid() = owner_id);

create policy "Only owner can update shares"
  on public.note_shares for update
  using (auth.uid() = owner_id);

create policy "Only owner can delete shares"
  on public.note_shares for delete
  using (auth.uid() = owner_id);

-- NOTIFICATIONS
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Update updated_at automatically
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_labels_updated before update on public.labels
  for each row execute function public.set_updated_at();
create trigger trg_notes_updated before update on public.notes
  for each row execute function public.set_updated_at();
create trigger trg_shares_updated before update on public.note_shares
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
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

-- Set pinned_at when pinning a note
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

create trigger trg_notes_pin before update on public.notes
  for each row execute function public.handle_note_pin();

-- ============================================================
-- STORAGE BUCKETS (run via Supabase dashboard or SQL)
-- ============================================================
-- Create buckets: 'note-attachments' (private) and 'avatars' (public)
insert into storage.buckets (id, name, public) 
values ('note-attachments', 'note-attachments', false)
on conflict do nothing;

insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict do nothing;

-- Storage policies for note-attachments
create policy "Users can upload to their own note folders"
  on storage.objects for insert
  with check (
    bucket_id = 'note-attachments' 
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view attachments they have access to"
  on storage.objects for select
  using (
    bucket_id = 'note-attachments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.note_attachments na
        join public.note_shares ns on ns.note_id = na.note_id
        where na.storage_path = name
        and ns.recipient_id = auth.uid()
      )
    )
  );

create policy "Users can delete their own attachments"
  on storage.objects for delete
  using (
    bucket_id = 'note-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Avatar bucket policies
create policy "Avatars are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Notes on Password-Protected Notes

The `password_hash` is a **separate** bcrypt hash stored alongside the note. It doesn't affect access control (RLS) — RLS still allows the owner to read the row — but the client **must** verify the password before decrypting/displaying content.

**Optional extra security**: encrypt note content client-side with a key derived from the password before storing. This means even if someone bypasses the UI check, they see ciphertext. Implement with Web Crypto API (AES-GCM + PBKDF2).

## Realtime Channels

For collaborative editing:
- Subscribe to `note:{noteId}` broadcast channel
- Use Yjs + y-protocols for CRDT-based merging
- Persist `yjs_state` binary periodically (every 5s after last edit)
