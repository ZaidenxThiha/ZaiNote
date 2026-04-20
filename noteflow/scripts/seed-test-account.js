/**
 * Run once to create a test account + sample notes in your Supabase project.
 * Usage: node scripts/seed-test-account.js
 *
 * Requires: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Parse .env.local manually
let url, key
try {
  const env = readFileSync('.env.local', 'utf-8')
  url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim()
  key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim()
} catch {
  console.error('Could not read .env.local — create it from .env.example first')
  process.exit(1)
}

const supabase = createClient(url, key)

const TEST_EMAIL = 'testuser@gmail.com'
const TEST_PASSWORD = 'ZaiNote123!'
const TEST_NAME = 'Test User'

async function seed() {
  console.log('Creating test account...')

  // Sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    options: { data: { display_name: TEST_NAME } },
  })

  if (signUpError && !signUpError.message.includes('already registered')) {
    console.error('Sign up error:', signUpError.message)
    process.exit(1)
  }

  // Sign in to get session
  const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })

  if (signInError) {
    console.error('Sign in error:', signInError.message)
    console.log('\nIf the account already exists, these are your test credentials:')
    printCredentials()
    process.exit(0)
  }

  const userId = session.user.id

  // Create sample labels
  const { data: labels } = await supabase.from('labels').upsert([
    { user_id: userId, name: 'Work', color: '#6366f1' },
    { user_id: userId, name: 'Personal', color: '#10b981' },
    { user_id: userId, name: 'Ideas', color: '#f59e0b' },
  ], { onConflict: 'user_id,name' }).select()

  // Create sample notes
  const { data: notes } = await supabase.from('notes').insert([
    {
      user_id: userId,
      title: 'Welcome to ZaiNote!',
      content: '<p>This is your first note. You can:</p><ul><li>Write rich text with <strong>formatting</strong></li><li>Add image attachments</li><li>Share with collaborators</li><li>Work offline — changes sync automatically</li></ul>',
      color: '#dbeafe',
      is_pinned: true,
    },
    {
      user_id: userId,
      title: 'Meeting Notes',
      content: '<h2>Q4 Planning</h2><p>Discussed roadmap priorities and key deliverables for next quarter.</p><ul><li>Ship new dashboard by end of month</li><li>User research interviews scheduled</li></ul>',
      color: '#fef3c7',
    },
    {
      user_id: userId,
      title: 'Shopping List',
      content: '<ul><li>Milk</li><li>Eggs</li><li>Coffee</li><li>Bread</li></ul>',
      color: '#d1fae5',
    },
    {
      user_id: userId,
      title: 'Project Ideas',
      content: '<p>Some ideas to explore:</p><ul><li>Mobile app version</li><li>AI-powered note summarization</li><li>Export to PDF/Markdown</li></ul>',
      color: '#e9d5ff',
    },
    {
      user_id: userId,
      title: 'Reading List',
      content: '<p>Books to read this year:</p><ul><li>The Pragmatic Programmer</li><li>Clean Code</li><li>Designing Data-Intensive Applications</li></ul>',
    },
  ]).select()

  // Attach label to first note
  if (labels && notes) {
    const workLabel = labels.find(l => l.name === 'Work')
    const ideasLabel = labels.find(l => l.name === 'Ideas')
    const personalLabel = labels.find(l => l.name === 'Personal')

    await supabase.from('note_labels').upsert([
      { note_id: notes[1].id, label_id: workLabel?.id },
      { note_id: notes[3].id, label_id: ideasLabel?.id },
      { note_id: notes[4].id, label_id: personalLabel?.id },
    ].filter(r => r.label_id))
  }

  console.log('✅ Test account created with sample data!\n')
  printCredentials()
}

function printCredentials() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  TEST ACCOUNT CREDENTIALS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Email:    ${TEST_EMAIL}`)
  console.log(`  Password: ${TEST_PASSWORD}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

seed().catch(console.error)
