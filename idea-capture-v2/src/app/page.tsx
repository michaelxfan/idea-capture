"use client";

import { useState, useEffect, useRef } from "react";
import { Task, Destination, EmailContext } from "@/lib/types";
import { calcScore } from "@/lib/score";
import { uploadImage } from "@/lib/upload";
import {
  isSupabaseConfigured,
  fetchTasks as dbFetchTasks,
  upsertTasks as dbUpsertTasks,
  updateTask as dbUpdateTask,
  deleteTask as dbDeleteTask,
  deleteAllTasks as dbDeleteAllTasks,
} from "@/lib/db";
import DestinationSection from "@/components/DestinationSection";
import ExecutiveSummary from "@/components/ExecutiveSummary";
import TaskCard from "@/components/TaskCard";
import WorkNowView from "@/components/WorkNowView";

type Tab = "capture" | "work-now";

const STORAGE_KEY = "idea-capture-v2-tasks";
const DEST_ORDER: Destination[] = ["Michael", "Ann", "AI", "Later"];

/* ── localStorage helpers (fallback/cache) ── */

function loadLocalTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/* ── Grouping ── */

function groupByDestination(tasks: Task[]): Record<Destination, Task[]> {
  const groups: Record<Destination, Task[]> = {
    Michael: [],
    Ann: [],
    AI: [],
    Later: [],
  };
  for (const t of tasks) {
    const dest = groups[t.destination] ? t.destination : "Later";
    groups[dest].push(t);
  }
  for (const dest of Object.keys(groups) as Destination[]) {
    groups[dest].sort((a, b) => calcScore(b) - calcScore(a));
  }
  return groups;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("capture");
  const [input, setInput] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedCollapsed, setCompletedCollapsed] = useState(true);
  const [scrollToTaskId, setScrollToTaskId] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [emailContext, setEmailContext] = useState<EmailContext | null>(null);
  const [emailParsing, setEmailParsing] = useState(false);
  const emlInputRef = useRef<HTMLInputElement | null>(null);
  const imgInputRef = useRef<HTMLInputElement | null>(null);

  // Hydrate: Supabase is source of truth; localStorage is offline fallback only
  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) {
        setTasks(loadLocalTasks());
        return;
      }

      const dbTasks = await dbFetchTasks();

      if (dbTasks.length > 0 || loadLocalTasks().length === 0) {
        // DB responded — trust it as canonical state
        setTasks(dbTasks);
        saveLocalTasks(dbTasks);
      } else {
        // DB returned empty but localStorage has tasks — likely a transient DB error
        // Keep localStorage tasks but don't re-upload (avoid resurrecting deleted tasks)
        setTasks(loadLocalTasks());
      }
    }
    load();
  }, []);

  // Scroll to newly created task
  useEffect(() => {
    if (!scrollToTaskId) return;
    // Small delay to let DOM render
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-task-id="${scrollToTaskId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setScrollToTaskId(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [scrollToTaskId]);

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setAttachedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  function removeImage() {
    setAttachedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }

  async function handleEmlFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".eml")) {
      setError("Only .eml files are supported");
      return;
    }
    setEmailParsing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-eml", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse email");
      setEmailContext(data.context);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse email");
    } finally {
      setEmailParsing(false);
    }
  }

  function removeEmail() {
    setEmailContext(null);
    if (emlInputRef.current) emlInputRef.current.value = "";
  }

  async function handleInterpret() {
    if (!input.trim() && !emailContext) return;

    setLoading(true);
    setError(null);

    try {
      // Upload image first if attached
      let imageUrl: string | undefined;
      if (attachedImage) {
        setImageUploading(true);
        try {
          imageUrl = await uploadImage(attachedImage);
        } catch {
          // Non-blocking: task still gets created without image
          console.error("Image upload failed");
        }
        setImageUploading(false);
      }

      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), emailContext }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      const newTasks: Task[] = data.tasks.map((t: Task) => ({
        ...t,
        imageUrl: imageUrl || undefined,
        emailContext: emailContext || undefined,
      }));
      setIsMock(data.mock ?? false);

      // Append new tasks
      setTasks((prev) => {
        const next = [...newTasks, ...prev];
        saveLocalTasks(next);
        return next;
      });

      // Persist to Supabase — await so we catch errors before claiming success
      const saved = await dbUpsertTasks(newTasks);
      if (!saved) {
        setError("Tasks saved locally but failed to sync to database. They'll retry on next reload.");
      }

      // Scroll to first new task after render
      if (newTasks.length > 0) {
        setScrollToTaskId(newTasks[0].id);
      }

      setInput("");
      removeImage();
      removeEmail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setImageUploading(false);
    }
  }

  function handleUpdateTask(updated: Task) {
    const prev = tasks.find((t) => t.id === updated.id);
    const destChanged = prev && prev.destination !== updated.destination;

    setTasks((all) => {
      const next = all.map((t) => (t.id === updated.id ? updated : t));
      saveLocalTasks(next);
      return next;
    });
    // Persist to Supabase
    dbUpdateTask(updated);

    // Scroll to the task after it moves to its new destination section
    if (destChanged) {
      setScrollToTaskId(updated.id);
    }
  }

  function handleDeleteTask(id: string) {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveLocalTasks(next);
      return next;
    });
    dbDeleteTask(id);
  }

  function handleCompleteTask(id: string) {
    const updated = tasks.find((t) => t.id === id);
    if (!updated) return;
    const completed = { ...updated, completed: true };
    handleUpdateTask(completed);
  }

  function handleClearAll() {
    if (!confirm("Clear all tasks? This cannot be undone.")) return;
    setTasks([]);
    localStorage.removeItem(STORAGE_KEY);
    dbDeleteAllTasks();
  }

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const grouped = groupByDestination(activeTasks);
  const totalTasks = tasks.length;

  return (
    <div
      style={{
        maxWidth: 760,
        width: "100%",
        margin: "0 auto",
        padding: "24px 16px 120px",
        overflowX: "hidden",
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: 16 }}>
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
          {tab === "capture" ? "Idea Capture" : "Work Now"}
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
          {tab === "capture"
            ? "structured tasks out"
            : "what to work on, right now"}
        </p>
      </header>

      {/* Tab bar */}
      <nav
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        {([
          { id: "capture" as Tab, label: "Idea Capture" },
          { id: "work-now" as Tab, label: "Work Now" },
        ]).map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                appearance: "none",
                background: "none",
                border: "none",
                padding: "10px 14px",
                marginBottom: -1,
                fontFamily: "var(--font-body)",
                fontSize: "0.78rem",
                fontWeight: active ? 600 : 500,
                letterSpacing: "0.02em",
                color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                borderBottom: active
                  ? "2px solid var(--text-primary)"
                  : "2px solid transparent",
                cursor: "pointer",
                transition: "color 0.12s, border-color 0.12s",
              }}
            >
              {label}
            </button>
          );
        })}
      </nav>

      {tab === "work-now" && <WorkNowView />}

      {tab === "capture" && (<>
      {/* Capture section */}
      <section style={{ marginBottom: 32 }}>
        <div className="section-label">Input</div>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            boxShadow: "var(--shadow)",
            overflow: "hidden",
            width: "100%",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleInterpret();
              }
            }}
            onPaste={(e) => {
              const items = e.clipboardData?.items;
              if (!items) return;
              for (const item of Array.from(items)) {
                if (item.type.startsWith("image/")) {
                  e.preventDefault();
                  const file = item.getAsFile();
                  if (file) handleImageFile(file);
                  return;
                }
              }
            }}
            onDrop={(e) => {
              const files = e.dataTransfer?.files;
              if (!files) return;
              for (const file of Array.from(files)) {
                if (file.type.startsWith("image/")) {
                  e.preventDefault();
                  handleImageFile(file);
                  return;
                }
                if (file.name.toLowerCase().endsWith(".eml")) {
                  e.preventDefault();
                  handleEmlFile(file);
                  return;
                }
              }
            }}
            onDragOver={(e) => {
              if (e.dataTransfer?.types?.includes("Files")) {
                e.preventDefault();
              }
            }}
            placeholder={"Capital Allocator Identity\n3x Throughput in 3M with Agentic AI\nCapacity, Assets, Influence"}
            rows={3}
            style={{
              width: "100%",
              minHeight: 72,
              border: "none",
              background: "transparent",
              padding: "12px 16px",
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              lineHeight: 1.6,
              color: "var(--text-primary)",
              resize: "vertical",
              outline: "none",
            }}
          />
          {/* Image preview */}
          {imagePreview && (
            <div
              style={{
                padding: "4px 16px 8px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={imagePreview}
                  alt="Attached"
                  style={{
                    maxHeight: 80,
                    maxWidth: 160,
                    borderRadius: 4,
                    border: "1px solid var(--border)",
                    objectFit: "cover",
                  }}
                />
                <button
                  onClick={removeImage}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text-tertiary)",
                    fontSize: "0.6rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              </div>
              <span
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {imageUploading ? "Uploading..." : "Image attached"}
              </span>
            </div>
          )}
          {/* Email preview */}
          {(emailContext || emailParsing) && (
            <div
              style={{
                margin: "4px 16px 8px",
                padding: "8px 10px",
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "var(--bg)",
                fontSize: "0.72rem",
                fontFamily: "var(--font-body)",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span style={{ fontSize: "0.85rem" }}>✉</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {emailParsing ? (
                  <span>Parsing email...</span>
                ) : emailContext ? (
                  <>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {emailContext.subject || "(no subject)"}
                    </div>
                    {emailContext.from && (
                      <div
                        style={{
                          fontSize: "0.65rem",
                          color: "var(--text-tertiary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        from {emailContext.from}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--text-tertiary)",
                        marginTop: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {emailContext.body.slice(0, 200)}
                    </div>
                  </>
                ) : null}
              </div>
              {emailContext && (
                <button
                  onClick={removeEmail}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text-tertiary)",
                    fontSize: "0.6rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          )}
          <input
            ref={emlInputRef}
            type="file"
            accept=".eml,message/rfc822"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleEmlFile(file);
            }}
            style={{ display: "none" }}
          />
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageFile(file);
            }}
            style={{ display: "none" }}
          />
          <div
            style={{
              borderTop: "1px solid var(--border-light)",
              padding: "8px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--text-tertiary)",
                flex: 1,
                minWidth: 0,
              }}
            >
              {input.trim()
                ? `${input.trim().split(/\s+/).length} words`
                : ""}
            </span>
            <button
              onClick={() => imgInputRef.current?.click()}
              disabled={loading}
              title="Attach image"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.72rem",
                fontWeight: 500,
                padding: "7px 10px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-secondary)",
                cursor: loading ? "not-allowed" : "pointer",
                minHeight: 34,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Image
            </button>
            <button
              onClick={() => emlInputRef.current?.click()}
              disabled={loading || emailParsing}
              title="Attach email (.eml)"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.72rem",
                fontWeight: 500,
                padding: "7px 10px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-secondary)",
                cursor: loading || emailParsing ? "not-allowed" : "pointer",
                minHeight: 34,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              ✉ Attach
            </button>
            <button
              onClick={handleInterpret}
              disabled={loading || (!input.trim() && !emailContext)}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.72rem",
                fontWeight: 600,
                padding: "7px 14px",
                borderRadius: 6,
                border: "none",
                background:
                  loading || (!input.trim() && !emailContext)
                    ? "var(--border)"
                    : "var(--accent)",
                color:
                  loading || (!input.trim() && !emailContext)
                    ? "var(--text-tertiary)"
                    : "#fff",
                cursor:
                  loading || (!input.trim() && !emailContext) ? "not-allowed" : "pointer",
                transition: "all 0.12s",
                letterSpacing: "0.02em",
                minHeight: 34,
              }}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </div>
      </section>

      {/* Executive Summary */}
      {!loading && activeTasks.length > 0 && <ExecutiveSummary tasks={activeTasks} />}

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
      {!loading && totalTasks > 0 && (
        <hr
          style={{
            border: "none",
            borderTop: "1px solid var(--border-light)",
            margin: "24px 0",
          }}
        />
      )}

      {/* Results — grouped by destination */}
      {!loading && totalTasks > 0 && (
        <section>
          {/* Section header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 16,
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
              Tasks
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {totalTasks} total
              </span>
              <button
                onClick={handleClearAll}
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-body)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                clear all
              </button>
            </div>
          </div>

          {/* Destination sections */}
          {DEST_ORDER.map((dest) => (
            <DestinationSection
              key={dest}
              destination={dest}
              tasks={grouped[dest]}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onCompleteTask={handleCompleteTask}
            />
          ))}
        </section>
      )}

      {/* Completed section */}
      {!loading && completedTasks.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--border-light)",
              margin: "0 0 24px",
            }}
          />
          <div
            onClick={() => setCompletedCollapsed(!completedCollapsed)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              userSelect: "none",
              marginBottom: completedCollapsed ? 0 : 12,
              paddingBottom: 6,
              borderBottom: "1px solid var(--border-light)",
            }}
          >
            <span
              style={{
                fontSize: "0.55rem",
                transition: "transform 0.2s",
                transform: completedCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                color: "var(--text-tertiary)",
              }}
            >
              &#9660;
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.95rem",
                fontWeight: 400,
                color: "var(--text-tertiary)",
              }}
            >
              Completed
            </span>
            <span style={{ flex: 1 }} />
            <span
              style={{
                fontSize: "0.65rem",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {completedTasks.length} task{completedTasks.length !== 1 ? "s" : ""}
            </span>
          </div>
          {!completedCollapsed && (
            <div
              style={{
                opacity: 0.5,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
      </>)}
    </div>
  );
}
