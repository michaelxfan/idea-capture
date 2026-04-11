"use client";

import { useState, useEffect } from "react";
import { Task } from "@/lib/types";
import TaskCard from "@/components/TaskCard";

const STORAGE_KEY = "idea-capture-v2";

interface SavedState {
  tasks: Task[];
  createdAt: string;
  isMock: boolean;
}

function loadSaved(): SavedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(tasks: Task[], isMock: boolean) {
  const state: SavedState = {
    tasks,
    createdAt: new Date().toISOString(),
    isMock,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Home() {
  const [input, setInput] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadSaved();
    if (saved && saved.tasks.length > 0) {
      setTasks(saved.tasks);
      setIsMock(saved.isMock);
      setCreatedAt(saved.createdAt);
    }
  }, []);

  async function handleInterpret() {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setTasks(data.tasks);
      setIsMock(data.mock ?? false);

      const now = new Date().toISOString();
      setCreatedAt(now);
      save(data.tasks, data.mock ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleUpdateTask(updated: Task) {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === updated.id ? updated : t));
      // Persist edits
      save(next, isMock);
      return next;
    });
  }

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "36px 24px 120px",
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.6rem",
            fontWeight: 400,
            letterSpacing: "0.02em",
            color: "var(--text-primary)",
            marginBottom: 2,
          }}
        >
          Idea Capture
        </h1>
        <p
          style={{
            fontSize: "0.78rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-body)",
          }}
        >
          messy thoughts in &mdash; structured tasks out
        </p>
      </header>

      {/* Capture section */}
      <section style={{ marginBottom: 32 }}>
        <div className="section-label">Capture</div>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            boxShadow: "var(--shadow)",
            overflow: "hidden",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Dump messy thoughts here..."
            rows={5}
            style={{
              width: "100%",
              minHeight: 120,
              border: "none",
              background: "transparent",
              padding: "16px 20px",
              fontFamily: "var(--font-body)",
              fontSize: "0.92rem",
              lineHeight: 1.7,
              color: "var(--text-primary)",
              resize: "vertical",
              outline: "none",
            }}
          />
          <div
            style={{
              borderTop: "1px solid var(--border-light)",
              padding: "10px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--text-tertiary)",
              }}
            >
              {input.trim()
                ? `${input.trim().split(/\s+/).length} words`
                : ""}
            </span>
            <button
              onClick={handleInterpret}
              disabled={loading || !input.trim()}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.84rem",
                fontWeight: 600,
                padding: "10px 18px",
                borderRadius: 6,
                border: "none",
                background: loading || !input.trim() ? "var(--border)" : "var(--accent)",
                color: loading || !input.trim() ? "var(--text-tertiary)" : "#fff",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                transition: "all 0.12s",
                letterSpacing: "0.02em",
                minHeight: 44,
              }}
            >
              {loading ? "Interpreting..." : "Interpret"}
            </button>
          </div>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "32px 0",
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--text-tertiary)",
                  animation: `bounce-dot 1.4s ${i * 0.16}s infinite ease-in-out both`,
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: "0.78rem",
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-body)",
            }}
          >
            Thinking...
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            background: "#fdf5f0",
            border: "1px solid #e8c4b0",
            borderRadius: 6,
            fontSize: "0.78rem",
            color: "#8b4a2a",
            fontFamily: "var(--font-body)",
          }}
        >
          {error}
        </div>
      )}

      {/* Mock mode */}
      {isMock && tasks.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            background: "#f5f0e0",
            border: "1px solid #d4c49a",
            borderRadius: 6,
            fontSize: "0.72rem",
            color: "#8b6b2a",
            fontFamily: "var(--font-body)",
          }}
        >
          Mock mode — no API key configured. Set IDEA_CAPTURE_ANTHROPIC_KEY in
          .env.local for real interpretation.
        </div>
      )}

      {/* Divider */}
      {!loading && tasks.length > 0 && (
        <hr
          style={{
            border: "none",
            borderTop: "1px solid var(--border-light)",
            margin: "24px 0",
          }}
        />
      )}

      {/* Results */}
      {!loading && tasks.length > 0 && (
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: "1px solid var(--border-light)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.95rem",
                fontWeight: 400,
                color: "var(--text-primary)",
              }}
            >
              Interpreted Tasks
            </span>
            <span
              style={{
                fontSize: "0.65rem",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {tasks.length} task{tasks.length !== 1 ? "s" : ""}
              {createdAt && ` · ${formatDate(createdAt)}`}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onUpdate={handleUpdateTask} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
