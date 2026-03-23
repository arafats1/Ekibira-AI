"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { useAuth } from "../context/AuthContext";

/* ── Default chart palette ── */
const DEFAULT_COLORS = ["#2d6a4f", "#4ade80", "#d97706", "#dc2626", "#2563eb", "#8b5cf6", "#06b6d4", "#f59e0b"];

/* ── Chart renderer ── */
function AdvisorChart({ chart }) {
  const colors = chart.colors?.length ? chart.colors : DEFAULT_COLORS;
  const xKey = chart.xKey || "name";
  const yKeys = chart.yKeys || ["value"];

  const common = {
    margin: { top: 5, right: 20, left: 0, bottom: 5 },
  };

  const tooltipStyle = {
    contentStyle: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      fontSize: 12,
      fontFamily: "var(--font-body)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    },
  };

  return (
    <div className="my-4 p-4 bg-[#f0fdf4] border border-[#d1e7d1] rounded-xl">
      {chart.title && (
        <p className="text-sm font-bold text-[#1a2e1a] mb-3 font-[family-name:var(--font-display)]">
          📊 {chart.title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={260}>
        {chart.type === "bar" ? (
          <BarChart data={chart.data} {...common}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {yKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        ) : chart.type === "pie" ? (
          <PieChart>
            <Pie
              data={chart.data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: "#9ca3af" }}
              style={{ fontSize: 11 }}
            >
              {chart.data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        ) : chart.type === "area" ? (
          <AreaChart data={chart.data} {...common}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {yKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.15} strokeWidth={2} />
            ))}
          </AreaChart>
        ) : (
          /* default: line chart */
          <LineChart data={chart.data} {...common}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {yKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/* ── Image renderer ── */
function AdvisorImage({ imageData }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    async function fetchImage() {
      try {
        const res = await fetch("/api/image-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: imageData.query }),
        });
        const data = await res.json();
        if (data.image) {
          setImage(data.image);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchImage();
  }, [imageData.query]);

  if (error) return null;

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-[#d1e7d1] bg-white shadow-sm">
      {loading ? (
        <div className="h-48 bg-[#f0fdf4] flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-[#6b7c6b]">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading image...
          </div>
        </div>
      ) : image ? (
        <>
          <div className="relative">
            <img
              src={image.url}
              alt={imageData.alt || imageData.caption}
              className="w-full max-h-72 object-cover"
              loading="lazy"
            />
          </div>
          <div className="px-4 py-2.5 bg-[#f8faf5] border-t border-[#e5e7eb]">
            <p className="text-xs text-[#374151] leading-relaxed font-[family-name:var(--font-body)]">
              📷 {imageData.caption}
            </p>
            <p className="text-[10px] text-[#9ca3af] mt-1 font-[family-name:var(--font-body)]">
              Source: {image.source}
              {image.attribution && ` · ${image.attribution}`}
              {image.license && ` · ${image.license}`}
              {image.pageUrl && (
                <> · <a href={image.pageUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2d6a4f]">View original</a></>
              )}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ── Parse response into text segments, chart blocks, and image blocks ── */
function parseResponseSegments(text) {
  const segments = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Find the next block of either type
    const chartStart = remaining.indexOf("|||CHART|||");
    const imageStart = remaining.indexOf("|||IMAGE|||");

    // Determine which comes first
    let nextType = null;
    let nextPos = -1;

    if (chartStart !== -1 && (imageStart === -1 || chartStart < imageStart)) {
      nextType = "chart";
      nextPos = chartStart;
    } else if (imageStart !== -1) {
      nextType = "image";
      nextPos = imageStart;
    }

    if (nextType === null) {
      // No more blocks
      segments.push({ type: "text", content: remaining });
      break;
    }

    // Text before the block
    if (nextPos > 0) {
      segments.push({ type: "text", content: remaining.slice(0, nextPos) });
    }

    if (nextType === "chart") {
      const endMarker = "|||END_CHART|||";
      const blockStart = "|||CHART|||";
      const chartEnd = remaining.indexOf(endMarker, nextPos);
      if (chartEnd === -1) {
        segments.push({ type: "text", content: remaining.slice(nextPos) });
        break;
      }
      const jsonStr = remaining.slice(nextPos + blockStart.length, chartEnd).trim();
      try {
        const chartData = JSON.parse(jsonStr);
        segments.push({ type: "chart", content: chartData });
      } catch {
        // JSON parse failed — skip the chart block
      }
      remaining = remaining.slice(chartEnd + endMarker.length);
    } else {
      const endMarker = "|||END_IMAGE|||";
      const blockStart = "|||IMAGE|||";
      const imageEnd = remaining.indexOf(endMarker, nextPos);
      if (imageEnd === -1) {
        segments.push({ type: "text", content: remaining.slice(nextPos) });
        break;
      }
      const jsonStr = remaining.slice(nextPos + blockStart.length, imageEnd).trim();
      try {
        const imageBlockData = JSON.parse(jsonStr);
        segments.push({ type: "image", content: imageBlockData });
      } catch {
        // JSON parse failed — skip the image block
      }
      remaining = remaining.slice(imageEnd + endMarker.length);
    }
  }

  return segments;
}

/* ── Markdown-like renderer for AI responses (with charts and images) ── */
function FormattedResponse({ text }) {
  const segments = parseResponseSegments(text);

  return (
    <div className="space-y-2 font-[family-name:var(--font-body)] text-sm text-[#374151] leading-relaxed">
      {segments.map((seg, si) => {
        if (seg.type === "chart") {
          return <AdvisorChart key={`chart-${si}`} chart={seg.content} />;
        }
        if (seg.type === "image") {
          return <AdvisorImage key={`image-${si}`} imageData={seg.content} />;
        }
        return <TextBlock key={`text-${si}`} text={seg.content} />;
      })}
    </div>
  );
}

function TextBlock({ text }) {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Strip markdown image syntax — these are handled by |||IMAGE||| blocks
        if (/^!\[.*?\]\(.*?\)$/.test(trimmed)) return null;
        // Also strip inline markdown images from mixed lines
        const cleanedLine = trimmed.replace(/!\[.*?\]\(.*?\)/g, "").trim();
        if (!cleanedLine) return null;

        // Headers
        if (cleanedLine.startsWith("### ")) {
          return (
            <h4 key={i} className="font-bold text-[#1a2e1a] text-base mt-4 mb-1 font-[family-name:var(--font-display)]">
              {cleanedLine.replace("### ", "")}
            </h4>
          );
        }
        if (cleanedLine.startsWith("## ")) {
          return (
            <h3 key={i} className="font-bold text-[#1a2e1a] text-lg mt-5 mb-2 font-[family-name:var(--font-display)]">
              {cleanedLine.replace("## ", "")}
            </h3>
          );
        }
        if (cleanedLine.startsWith("# ")) {
          return (
            <h2 key={i} className="font-bold text-[#1a2e1a] text-xl mt-5 mb-2 font-[family-name:var(--font-display)]">
              {cleanedLine.replace("# ", "")}
            </h2>
          );
        }

        // Horizontal rule
        if (cleanedLine === "---" || cleanedLine === "***") {
          return <hr key={i} className="border-[#e5e7eb] my-3" />;
        }

        // Bullet points
        if (cleanedLine.startsWith("- ") || cleanedLine.startsWith("* ")) {
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
              <span>{renderInline(cleanedLine.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = cleanedLine.match(/^(\d+)\.\s(.+)/);
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="text-[#2d6a4f] font-bold text-sm mt-0.5 w-5 text-right flex-shrink-0">{numMatch[1]}.</span>
              <span>{renderInline(numMatch[2])}</span>
            </div>
          );
        }

        // Regular paragraph
        return <p key={i}>{renderInline(cleanedLine)}</p>;
      })}
    </>
  );
}

function renderInline(text) {
  // Strip any remaining markdown image syntax
  const cleaned = text.replace(/!\[.*?\]\(.*?\)/g, "").trim();
  if (!cleaned) return null;

  const parts = [];
  let remaining = cleaned;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(
        <strong key={key++} className="font-semibold text-[#1a2e1a]">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/40 animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/40 animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-2 h-2 rounded-full bg-[#2d6a4f]/40 animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export default function AdvisorPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hydrated = useRef(false);
  const sessionIdRef = useRef("");
  const { user } = useAuth();

  // Generate session ID on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("kibira_session_id");
    if (stored) {
      sessionIdRef.current = stored;
    } else {
      sessionIdRef.current = Date.now().toString(36) + Math.random().toString(36).slice(2);
      sessionStorage.setItem("kibira_session_id", sessionIdRef.current);
    }
  }, []);

  // Load persisted chat on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kibira_chat");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {}
    hydrated.current = true;
  }, []);

  // Persist chat on change
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem("kibira_chat", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history,
          userEmail: user?.email || "",
          userName: user?.fullName || "",
          sessionId: sessionIdRef.current,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Something went wrong. Please try again." },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
    try { localStorage.removeItem("kibira_chat"); } catch {}
  };

  const sidebarQueries = [
    { label: "Mabira Deforestation", icon: "🛰️", query: "Analyze the deforestation patterns in Mabira Forest, Uganda. Show historical trends, primary drivers, spatial patterns, and satellite data insights." },
    { label: "Congo Basin Reforestation", icon: "🌱", query: "Recommend native reforestation strategies for the Congo Basin. Include species selection, restoration approaches, community engagement models, and cost estimates." },
    { label: "East Africa Carbon Tracking", icon: "📊", query: "Track carbon sequestration potential for reforestation projects in East Africa. Include species-specific rates, carbon pool breakdowns, and 20-year projections." },
    { label: "West Africa Forest Loss", icon: "🌴", query: "Give me a comprehensive deforestation pattern analysis for Ghana and Côte d'Ivoire, including driver breakdown, rate of change, and tipping point assessment." },
    { label: "Sahel Great Green Wall", icon: "🏜️", query: "What native reforestation strategies are recommended for Africa's Great Green Wall? Include species suited for arid conditions, FMNR techniques, and carbon credit opportunities." },
    { label: "Lake Victoria Restoration", icon: "🌊", query: "Analyze deforestation around Lake Victoria's catchment area and recommend restoration strategies with carbon sequestration estimates and community benefits." },
    { label: "Kampala Climate Risk", icon: "🏙️", query: "What is the current climate status and future predictions for Kampala, Uganda? Include flood risk, heat risk, and recommendations." },
    { label: "Nairobi Urban Heat", icon: "🌡️", query: "What is the urban heat island effect in Nairobi, Kenya? Provide risk assessment and mitigation strategies." },
  ];

  return (
    <div className="h-screen flex bg-[#f7faf6] overflow-hidden">

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:relative z-50 md:z-auto flex flex-col w-[260px] h-full bg-[#0f2618] text-white transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg">🌿</span>
            <span className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight group-hover:text-[#4ade80] transition-colors">
              KibiraAI
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-white/10 rounded-lg">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/10 transition-colors text-sm font-[family-name:var(--font-body)]"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Analysis
          </button>
        </div>

        <div className="px-3 mb-2 flex-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold px-2 mb-2 font-[family-name:var(--font-body)]">
            Try asking about
          </p>
          <div className="space-y-0.5">
            {sidebarQueries.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(item.query);
                  setSidebarOpen(false);
                  setTimeout(() => {
                    const form = document.getElementById("advisor-form");
                    if (form) form.requestSubmit();
                  }, 100);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/8 transition-colors text-left group"
              >
                <span className="text-sm">{item.icon}</span>
                <span className="text-sm text-white/70 group-hover:text-white/90 font-[family-name:var(--font-body)] truncate">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/8 transition-colors text-sm text-white/60 hover:text-white/90 font-[family-name:var(--font-body)]"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
            </svg>
            Back to Home
          </Link>
          <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-white/30 font-[family-name:var(--font-body)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
            Powered by KibiraAI + GPT-4o
          </div>
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#e5e7eb] bg-white/80 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 -ml-1 hover:bg-[#f0fdf4] rounded-lg transition-colors"
          >
            <svg width="20" height="20" fill="none" stroke="#1a2e1a" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <h1 className="text-base font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Climate Research Assistant</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              className="hidden md:flex items-center gap-1.5 text-xs text-[#6b7c6b] hover:text-[#2d6a4f] transition-colors font-[family-name:var(--font-body)]"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
              </svg>
              Home
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
              <span className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">AI Online</span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center pt-8 sm:pt-16 pb-8 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-[#2d6a4f] flex items-center justify-center text-2xl mb-6 shadow-lg shadow-[#2d6a4f]/20">
                  🌿
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">
                  Hello! I&apos;m Dr. Kibira
                </h2>
                <p className="text-[#6b7c6b] text-sm sm:text-base text-center max-w-md mb-8 font-[family-name:var(--font-body)]">
                  Your dedicated climate researcher. Ask me about deforestation patterns, native reforestation strategies, carbon sequestration tracking, and climate resilience — empowering communities across Africa to fight climate change.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {[
                    { icon: "🛰️", title: "Deforestation Analysis", desc: "Patterns, drivers & satellite insights", query: "Analyze the deforestation patterns in Uganda's major forests. Show historical trends, primary drivers, spatial patterns, and what satellite data reveals." },
                    { icon: "🌱", title: "Reforestation Strategies", desc: "Native species & restoration plans", query: "Recommend native reforestation strategies for degraded forests in East Africa. Include species selection, planting design, and community engagement models." },
                    { icon: "📊", title: "Carbon Sequestration", desc: "Tracking, credits & projections", query: "What is the carbon sequestration potential for a 500-hectare reforestation project in the Congo Basin? Include species-specific rates, 20-year projections, and carbon credit valuation." },
                    { icon: "🌍", title: "Climate Predictions", desc: "10-20 year regional projections", query: "What are the climate change predictions for East Africa over the next 20 years? Include temperature, rainfall, forest cover, and ecosystem impacts." },
                  ].map((card, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(card.query);
                        setTimeout(() => {
                          const form = document.getElementById("advisor-form");
                          if (form) form.requestSubmit();
                        }, 100);
                      }}
                      className="text-left p-4 rounded-xl border border-[#dce9dc] hover:border-[#4ade80]/50 bg-white hover:bg-[#f0fdf4] transition-all group"
                    >
                      <span className="text-lg">{card.icon}</span>
                      <p className="text-sm font-semibold text-[#1a2e1a] mt-2 font-[family-name:var(--font-display)]">{card.title}</p>
                      <p className="text-xs text-[#6b7c6b] mt-0.5 font-[family-name:var(--font-body)]">{card.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" && (
                  <div className="flex gap-3 justify-end">
                    <div className="bg-[#2d6a4f] text-white rounded-2xl rounded-br-sm px-5 py-3 max-w-[80%] shadow-sm">
                      <p className="text-sm leading-relaxed font-[family-name:var(--font-body)]">{msg.content}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#1a2e1a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 font-[family-name:var(--font-body)]">
                      You
                    </div>
                  </div>
                )}
                {msg.role === "assistant" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2d6a4f] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm font-[family-name:var(--font-body)]">
                      DK
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[#6b7c6b] mb-1 font-[family-name:var(--font-body)]">Dr. Kibira &middot; Climate Researcher</p>
                      <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-[#e5e7eb]">
                        <FormattedResponse text={msg.content} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2d6a4f] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm font-[family-name:var(--font-body)]">
                  DK
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#6b7c6b] mb-1 font-[family-name:var(--font-body)]">Dr. Kibira is curating your response...</p>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm border border-[#e5e7eb]">
                    <TypingIndicator />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-[#e5e7eb] bg-white/80 backdrop-blur-sm px-4 py-3 sm:py-4">
          <form
            id="advisor-form"
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto flex items-center gap-3 bg-white border border-[#d1d5db] rounded-2xl px-4 py-2 focus-within:border-[#2d6a4f] focus-within:ring-2 focus-within:ring-[#2d6a4f]/15 transition-all shadow-sm"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about any location, climate risk, or environmental topic..."
              className="flex-1 min-w-0 py-2 text-sm text-[#1a2e1a] focus:outline-none bg-transparent font-[family-name:var(--font-body)] placeholder:text-[#9ca3af]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
          <p className="text-center text-[10px] text-[#9ca3af] mt-2 font-[family-name:var(--font-body)]">
            Climate Research Assistant is powered by GPT-4o with specialized African climate and environmental knowledge.
          </p>
        </div>
      </div>
    </div>
  );
}
