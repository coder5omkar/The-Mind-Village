"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { ActionChip } from "@/components/action-chip";
import { VillagerPortrait } from "@/components/villager-portrait";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  AnalyzeResponse,
  ResidentSummary,
  ResidentsResponse,
  ThoughtItem,
} from "@/lib/types";
import { cn } from "@/lib/utils";

// The Council Hall as a chat window. The user writes thoughts, the village
// answers as chat bubbles. Readings are persisted, so the conversation
// history is restored from /api/thoughts on mount.

type UserMessage = { id: string; role: "user"; text: string };

type Surrounder = {
  id?: string;
  name: string;
  district?: string;
  status?: string;
};

type VillageMessage = {
  id: string;
  role: "village";
  thoughtId: string;
  resident: ResidentSummary | null;
  confidence: number | null;
  action: string | null;
  reasoning: string | null;
  surrounders: Surrounder[];
  feedback: string | null;
};

type ChatMessage = UserMessage | VillageMessage;

const LOADING_MESSAGES = [
  "The village is gathering...",
  "Listening for the voice...",
  "The Witness is observing...",
  "Weighing this resident's power...",
];

export function HallChat({
  onAnalyzed,
  onRefresh,
  className,
}: {
  onAnalyzed: (result: AnalyzeResponse) => void;
  onRefresh: () => void;
  className?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [residents, setResidents] = useState<ResidentSummary[]>([]);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [feedbackMode, setFeedbackMode] = useState<null | "partial" | "wrong">(
    null
  );
  const [correctedId, setCorrectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [xpFlash, setXpFlash] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore the conversation from saved thoughts (oldest first).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/thoughts")
      .then((response) => response.json())
      .then((payload: { thoughts: ThoughtItem[] }) => {
        if (cancelled) return;
        const ordered = [...(payload.thoughts ?? [])].reverse();
        const history: ChatMessage[] = [];
        for (const thought of ordered) {
          history.push({ id: `u-${thought.id}`, role: "user", text: thought.text });
          history.push({
            id: `v-${thought.id}`,
            role: "village",
            thoughtId: thought.id,
            resident: thought.primaryResident,
            confidence: thought.confidence,
            action: thought.suggestedAction,
            reasoning: thought.reasoning,
            surrounders: thought.neighbors ?? [],
            feedback: thought.feedback,
          });
        }
        setMessages(history.slice(-40));
        setHistoryLoaded(true);
      })
      .catch(() => setHistoryLoaded(true));

    fetch("/api/residents")
      .then((response) => response.json())
      .then((payload: ResidentsResponse) =>
        setResidents(payload.districts.flatMap((district) => district.residents))
      )
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the newest message in view.
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, analyzing]);

  useEffect(() => {
    if (!analyzing) return;
    setMessageIndex(0);
    const timer = setInterval(() => {
      setMessageIndex((index) => (index + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [analyzing]);

  useEffect(() => {
    if (!xpFlash) return;
    const timer = setTimeout(() => setXpFlash(0), 2000);
    return () => clearTimeout(timer);
  }, [xpFlash]);

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    const thought = text.trim();
    if (analyzing || thought.length < 3) return;
    setText("");
    setError(null);
    setAnalyzing(true);
    setMessages((previous) => [
      ...previous,
      { id: `u-${Date.now()}`, role: "user", text: thought },
    ]);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: thought }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "The village could not read that thought.");
      }
      const result = data as AnalyzeResponse;
      setMessages((previous) => [
        ...previous,
        {
          id: `v-${result.thought.id}`,
          role: "village",
          thoughtId: result.thought.id,
          resident: result.primary,
          confidence: result.thought.confidence,
          action: result.thought.suggestedAction,
          reasoning: result.thought.reasoning,
          surrounders: result.thought.neighbors ?? [],
          feedback: null,
        },
      ]);
      setXpFlash(Date.now());
      onAnalyzed(result);
      onRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function sendFeedback(
    thoughtId: string,
    feedback: "correct" | "partial" | "wrong",
    correctedResidentId?: string
  ) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/thoughts/${thoughtId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback, correctedResidentId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not save your feedback.");
      }
      setMessages((previous) =>
        previous.map((message) =>
          message.role === "village" && message.thoughtId === thoughtId
            ? { ...message, feedback }
            : message
        )
      );
      setFeedbackFor(null);
      setFeedbackMode(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save feedback.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={cn(
        "game-panel min-h-0 flex-col overflow-hidden",
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b-2 border-black/40 px-3 py-2">
        <span className="flex items-center gap-2 font-display text-xs tracking-wide text-gold-200 [text-shadow:0_1px_0_rgba(0,0,0,0.5)]">
          <span className="text-base leading-none">💬</span> CHAT WITH THE VILLAGE
        </span>
        {xpFlash ? (
          <span
            key={xpFlash}
            className="animate-rise rounded-lg border-2 border-gold-700 bg-gradient-to-b from-gold-300 to-gold-500 px-2 py-0.5 font-display text-[10px] text-[#3d2500]"
          >
            +10 XP
          </span>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3"
      >
        {!historyLoaded ? (
          <p className="text-[11px] font-bold text-slate-500">
            Opening the hall...
          </p>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl rounded-tl-md border-2 border-black/40 bg-[#0d1526]/85 p-3">
            <p className="font-display text-sm tracking-wide text-gold-200">
              Welcome to the Council Hall.
            </p>
            <p className="mt-1.5 text-[11px] font-bold leading-relaxed text-slate-400">
              Write what is on your mind below. The village will name the
              resident who is speaking, and the map will wake them up.
            </p>
          </div>
        ) : null}

        {messages.map((message) =>
          message.role === "user" ? (
            <div
              key={message.id}
              className="ml-auto max-w-[85%] rounded-2xl rounded-br-md border-2 border-black/40 bg-gradient-to-b from-[#2b3c63] to-[#1a2540] px-3 py-2 text-xs font-semibold text-slate-100 shadow-chip"
            >
              {message.text}
            </div>
          ) : (
            <div key={message.id} className="max-w-[95%] space-y-1.5">
              <div className="flex items-center gap-2">
                {message.resident ? (
                  <VillagerPortrait
                    name={message.resident.name}
                    district={message.resident.district}
                    size={30}
                    frame={false}
                  />
                ) : (
                  <span className="text-lg leading-none">❔</span>
                )}
                <span className="font-display text-sm tracking-wide text-gold-200">
                  {message.resident?.name ?? "The village"}
                </span>
                {message.confidence != null ? (
                  <span className="text-[10px] font-bold text-slate-500">
                    {Math.round(message.confidence * 100)}%
                  </span>
                ) : null}
              </div>
              <div className="rounded-2xl rounded-tl-md border-2 border-black/40 bg-[#0d1526]/85 p-2.5">
                {message.action ? <ActionChip action={message.action} /> : null}
                {message.reasoning ? (
                  <p className="mt-1.5 font-serif text-[11px] italic leading-relaxed text-slate-300">
                    {message.reasoning}
                  </p>
                ) : null}

                {message.surrounders.length > 0 ? (
                  <p className="mt-2 text-[9px] font-bold text-slate-500">
                    🔮 {message.surrounders.length} surrounding resident
                    {message.surrounders.length === 1 ? "" : "s"} suggested -
                    agree, disagree or skip them in the panel below the map.
                  </p>
                ) : null}

                <div className="mt-2 border-t-2 border-black/25 pt-2">
                  {message.feedback ? (
                    <p className="text-[10px] font-bold text-emerald-300">
                      ✓ {message.feedback} - power shifted
                    </p>
                  ) : feedbackFor === message.thoughtId ? (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        <Button
                          variant="success"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          disabled={saving}
                          onClick={() =>
                            sendFeedback(message.thoughtId, "correct")
                          }
                        >
                          ✓ Correct
                        </Button>
                        <Button
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          disabled={saving}
                          onClick={() =>
                            setFeedbackMode(
                              feedbackMode === "partial" ? null : "partial"
                            )
                          }
                        >
                          ~ Partly
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          disabled={saving}
                          onClick={() =>
                            setFeedbackMode(
                              feedbackMode === "wrong" ? null : "wrong"
                            )
                          }
                        >
                          ✗ Wrong
                        </Button>
                      </div>
                      {feedbackMode ? (
                        <div className="flex gap-1.5">
                          <Select
                            value={correctedId}
                            onChange={(event) =>
                              setCorrectedId(event.target.value)
                            }
                            className="h-7 flex-1 text-[10px]"
                          >
                            <option value="">
                              Which resident was speaking?
                            </option>
                            {residents.map((resident) => (
                              <option key={resident.id} value={resident.id}>
                                {resident.name}
                              </option>
                            ))}
                          </Select>
                          <Button
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            disabled={!correctedId || saving}
                            onClick={() =>
                              sendFeedback(message.thoughtId, feedbackMode, correctedId)
                            }
                          >
                            {saving ? "..." : "Save"}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      className="text-[10px] font-bold text-slate-500 transition hover:text-gold-200"
                      onClick={() => {
                        setFeedbackFor(message.thoughtId);
                        setFeedbackMode(null);
                      }}
                    >
                      Rate this reading
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {analyzing ? (
          <div className="flex items-center gap-2">
            <span className="animate-wiggle text-xl leading-none">🔮</span>
            <div className="animate-pulse-soft rounded-2xl rounded-tl-md border-2 border-black/40 bg-[#0d1526]/85 px-3 py-2 text-[11px] font-bold text-gold-200">
              {LOADING_MESSAGES[messageIndex]}
            </div>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t-2 border-black/40 bg-[#0d1526]/50 p-2.5"
      >
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          rows={2}
          placeholder="Type a thought..."
          className="scroll-input min-h-[54px] resize-none border-0 text-xs font-semibold leading-relaxed placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-gold-400/60"
          maxLength={4000}
          disabled={analyzing}
        />
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-[9px] font-bold text-slate-500">
            Enter to send - Shift+Enter for a new line
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={text.trim().length < 3 || analyzing}
          >
            <Send className="h-3.5 w-3.5" /> Send
          </Button>
        </div>
        {error ? (
          <p className="mt-1.5 text-[10px] font-bold text-rose-300/90">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
