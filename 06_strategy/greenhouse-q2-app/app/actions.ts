'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Big rocks ──────────────────────────────────────────────

export async function updateRockField(
  id: string,
  field: 'title' | 'description',
  value: string
) {
  const supabase = createClient()
  await supabase
    .from('big_rocks')
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/')
}

// ── Tactics ────────────────────────────────────────────────

export async function updateTacticText(id: string, text: string) {
  const supabase = createClient()
  await supabase.from('tactics').update({ text }).eq('id', id)
  revalidatePath('/')
}

export async function addTactic(bigRockId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('tactics')
    .select('position')
    .eq('big_rock_id', bigRockId)
    .order('position', { ascending: false })
    .limit(1)
  const nextPos = (data?.[0]?.position ?? 0) + 1
  await supabase.from('tactics').insert({
    big_rock_id: bigRockId,
    position: nextPos,
    text: 'New tactic',
  })
  revalidatePath('/')
}

export async function deleteTactic(id: string) {
  const supabase = createClient()
  await supabase.from('tactics').delete().eq('id', id)
  revalidatePath('/')
}

// ── Milestones ─────────────────────────────────────────────

export async function updateMilestoneField(
  id: string,
  field: 'name' | 'date',
  value: string
) {
  const supabase = createClient()
  await supabase.from('milestones').update({ [field]: value }).eq('id', id)
  revalidatePath('/')
}

export async function cycleMilestoneStatus(id: string, current: string) {
  const next =
    current === 'upcoming'
      ? 'in-progress'
      : current === 'in-progress'
      ? 'completed'
      : 'upcoming'
  const supabase = createClient()
  await supabase.from('milestones').update({ status: next }).eq('id', id)
  revalidatePath('/')
}

export async function addMilestone(bigRockId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('milestones')
    .select('position')
    .eq('big_rock_id', bigRockId)
    .order('position', { ascending: false })
    .limit(1)
  const nextPos = (data?.[0]?.position ?? 0) + 1
  await supabase.from('milestones').insert({
    big_rock_id: bigRockId,
    position: nextPos,
    name: 'New milestone',
    date: 'TBD',
    status: 'upcoming',
  })
  revalidatePath('/')
}

export async function deleteMilestone(id: string) {
  const supabase = createClient()
  await supabase.from('milestones').delete().eq('id', id)
  revalidatePath('/')
}

// ── AI Plan generation ─────────────────────────────────────

const PLAN_SYSTEM_PROMPT = `You are a sharp, no-fluff strategic execution planner for an ecommerce founder running Greenhouse, a wellness/supplements brand.

Given a tactic from a quarterly big rock, produce 3-5 concrete next steps to execute it.

Rules:
- Each step is a single imperative sentence (start with a verb).
- Steps should be specific enough to action in a week, not vague advice.
- No filler phrases ("consider", "think about", "explore the possibility of").
- Reference channels, tools, or roles where appropriate (TikTok, Amazon, ClickUp, Fiena, etc).
- Avoid generic best-practice statements — assume the user knows the basics.
- Output ONLY a JSON array of strings. No prose, no markdown, no explanation.

Example output format:
["Audit current TikTok creative library and tag top 10 by ROAS", "Brief Fiena on 5 new hooks aligned to Detox SKU", "Set up daily ROAS dashboard in Looker"]`

export async function generatePlan(tacticId: string) {
  const supabase = createClient()

  // Fetch tactic + parent rock for context
  const { data: tactic } = await supabase
    .from('tactics')
    .select('id, text, big_rock_id')
    .eq('id', tacticId)
    .single()

  if (!tactic) throw new Error('Tactic not found')

  const { data: rock } = await supabase
    .from('big_rocks')
    .select('title, description')
    .eq('id', tactic.big_rock_id)
    .single()

  const userMessage = `Big rock: ${rock?.title ?? 'Unknown'}
Big rock description: ${rock?.description ?? ''}

Tactic to plan: ${tactic.text}

Generate 3-5 concrete execution steps as a JSON array of strings.`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: [
      {
        type: 'text',
        text: PLAN_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  const raw = textBlock && 'text' in textBlock ? textBlock.text.trim() : '[]'

  // Parse JSON array, tolerating accidental code fences
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  let steps: string[] = []
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) steps = parsed.filter((s) => typeof s === 'string')
  } catch {
    steps = [raw]
  }

  await supabase.from('tactics').update({ plan_steps: steps }).eq('id', tacticId)
  revalidatePath('/')
  return steps
}

export async function clearPlan(tacticId: string) {
  const supabase = createClient()
  await supabase.from('tactics').update({ plan_steps: null }).eq('id', tacticId)
  revalidatePath('/')
}

// ── Config (header/band) ───────────────────────────────────

export async function updateConfigField(
  field:
    | 'title'
    | 'subtitle'
    | 'note'
    | 'revenue_target'
    | 'strategic_phrase'
    | 'footer',
  value: string
) {
  const supabase = createClient()
  await supabase
    .from('config')
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq('id', 1)
  revalidatePath('/')
}
