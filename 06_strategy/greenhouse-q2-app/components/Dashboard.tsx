'use client'

import { useState, useTransition, type ReactNode } from 'react'
import * as actions from '@/app/actions'

// ── Types ──────────────────────────────────────────────────

type Channel = { label: string; value: string }

type Milestone = {
  id: string
  position: number
  name: string
  date: string
  status: 'upcoming' | 'in-progress' | 'completed'
}

type Tactic = {
  id: string
  position: number
  text: string
  plan_steps: string[] | null
}

type BigRock = {
  id: string
  position: number
  title: string
  description: string
  channel_targets: Channel[] | null
  tactics: Tactic[]
  milestones: Milestone[]
}

type Config = {
  title: string
  subtitle: string
  note: string
  revenue_target: string
  strategic_phrase: string
  channels: Channel[]
  footer: string
}

// ── Dashboard ──────────────────────────────────────────────

export function Dashboard({
  config,
  rocks,
}: {
  config: Config
  rocks: BigRock[]
}) {
  return (
    <div className="page">
      <div className="header">
        <EditableText
          value={config.title}
          as="h1"
          onSave={(v) => actions.updateConfigField('title', v)}
        />
        <EditableText
          value={config.subtitle}
          className="subtitle"
          onSave={(v) => actions.updateConfigField('subtitle', v)}
        />
        <EditableText
          value={config.note}
          className="note"
          onSave={(v) => actions.updateConfigField('note', v)}
        />
      </div>

      <div className="strategy-band">
        <div className="band-stat">
          <EditableText
            value={config.revenue_target}
            className="value"
            onSave={(v) => actions.updateConfigField('revenue_target', v)}
          />
          <div className="label">Q2 Revenue Target</div>
        </div>
        <div className="band-divider" />
        <div className="band-channels">
          {config.channels.map((c, i) => (
            <div className="band-channel" key={i}>
              <div className="value">{c.value}</div>
              <div className="label">{c.label}</div>
            </div>
          ))}
        </div>
        <div className="band-divider" />
        <EditableText
          value={config.strategic_phrase}
          className="band-phrase"
          onSave={(v) => actions.updateConfigField('strategic_phrase', v)}
        />
      </div>

      <div className="cards">
        {rocks.map((r) => (
          <BigRockCard key={r.id} rock={r} />
        ))}
      </div>

      <div className="footer">
        <EditableText
          value={config.footer}
          as="p"
          onSave={(v) => actions.updateConfigField('footer', v)}
        />
      </div>
    </div>
  )
}

// ── Big Rock Card ──────────────────────────────────────────

function BigRockCard({ rock }: { rock: BigRock }) {
  const [, startTransition] = useTransition()
  const run = (fn: () => Promise<unknown>) => startTransition(() => void fn())

  const total = rock.milestones.length
  const weighted = rock.milestones.reduce(
    (acc, m) =>
      acc +
      (m.status === 'completed' ? 1 : m.status === 'in-progress' ? 0.5 : 0),
    0
  )
  const progress = total > 0 ? Math.round((weighted / total) * 100) : 0

  return (
    <div className="card">
      <div className="card-header">
        <EditableText
          value={rock.title}
          as="h2"
          onSave={(v) => actions.updateRockField(rock.id, 'title', v)}
        />
        <EditableText
          value={rock.description}
          className="desc"
          onSave={(v) => actions.updateRockField(rock.id, 'description', v)}
        />
      </div>

      <div className="tactics-title">Major Tactics</div>
      <ul className="tactics">
        {rock.tactics.map((t) => (
          <TacticRow key={t.id} tactic={t} />
        ))}
        <li className="add-row">
          <button
            className="add-btn"
            onClick={() => run(() => actions.addTactic(rock.id))}
          >
            + Add tactic
          </button>
        </li>
      </ul>

      <div className="progress-section">
        <div className="progress-label-row">
          <span className="pl">Progress</span>
          <span className="pv">{progress}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="milestones-title">Key Milestones</div>
        {rock.milestones.map((m) => (
          <div className="milestone editable-row" key={m.id}>
            <button
              className={`ms-dot ${m.status}`}
              title="Click to cycle status"
              onClick={() =>
                run(() => actions.cycleMilestoneStatus(m.id, m.status))
              }
            />
            <EditableText
              value={m.name}
              className="ms-name"
              onSave={(v) => actions.updateMilestoneField(m.id, 'name', v)}
            />
            <EditableText
              value={m.date}
              className="ms-date"
              onSave={(v) => actions.updateMilestoneField(m.id, 'date', v)}
            />
            <button
              className="row-delete"
              title="Remove milestone"
              onClick={() => run(() => actions.deleteMilestone(m.id))}
            >
              ×
            </button>
          </div>
        ))}
        <div className="add-row">
          <button
            className="add-btn"
            onClick={() => run(() => actions.addMilestone(rock.id))}
          >
            + Add milestone
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tactic row with collapsible Plan ───────────────────────

function TacticRow({ tactic }: { tactic: Tactic }) {
  const [, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [steps, setSteps] = useState<string[] | null>(tactic.plan_steps)

  const onPlanClick = async () => {
    if (steps && steps.length > 0) {
      setExpanded((v) => !v)
      return
    }
    setExpanded(true)
    setLoading(true)
    try {
      const result = await actions.generatePlan(tactic.id)
      setSteps(result)
    } catch (e) {
      setSteps([`Error generating plan: ${(e as Error).message}`])
    } finally {
      setLoading(false)
    }
  }

  const onRegenerate = async () => {
    setLoading(true)
    setSteps(null)
    try {
      const result = await actions.generatePlan(tactic.id)
      setSteps(result)
    } catch (e) {
      setSteps([`Error: ${(e as Error).message}`])
    } finally {
      setLoading(false)
    }
  }

  return (
    <li className="tactic-item">
      <div className="editable-row tactic-main">
        <EditableText
          value={tactic.text}
          onSave={(v) => actions.updateTacticText(tactic.id, v)}
        />
        <button
          className={`plan-btn ${expanded ? 'open' : ''}`}
          onClick={onPlanClick}
          title="Generate or toggle execution plan"
        >
          Plan
        </button>
        <button
          className="row-delete"
          title="Remove tactic"
          onClick={() =>
            startTransition(() => void actions.deleteTactic(tactic.id))
          }
        >
          ×
        </button>
      </div>
      {expanded && (
        <div className="plan-panel">
          {loading && <div className="plan-loading">Generating plan…</div>}
          {!loading && steps && steps.length > 0 && (
            <>
              <ol className="plan-steps">
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <div className="plan-actions">
                <button className="plan-link" onClick={onRegenerate}>
                  Regenerate
                </button>
              </div>
            </>
          )}
          {!loading && (!steps || steps.length === 0) && (
            <div className="plan-empty">No steps yet.</div>
          )}
        </div>
      )}
    </li>
  )
}

// ── Editable Text (click-to-edit) ──────────────────────────

function EditableText({
  value,
  onSave,
  className,
  as = 'span',
}: {
  value: string
  onSave: (v: string) => Promise<unknown> | void
  className?: string
  as?: 'span' | 'div' | 'h1' | 'h2' | 'p'
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [, startTransition] = useTransition()

  if (editing) {
    const commit = () => {
      setEditing(false)
      const next = draft.trim()
      if (next && next !== value) {
        startTransition(() => {
          void onSave(next)
        })
      } else {
        setDraft(value)
      }
    }
    return (
      <input
        className={`editable-input ${className ?? ''}`}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            ;(e.currentTarget as HTMLInputElement).blur()
          } else if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
      />
    )
  }

  const Tag = as as keyof JSX.IntrinsicElements
  return (
    <Tag
      className={`editable ${className ?? ''}`}
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
    >
      {value as ReactNode}
    </Tag>
  )
}
