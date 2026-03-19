"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

function useAdminGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?redirect=/admin");
      } else if (user.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);
  return { user, loading, isAdmin: user && user.role === "admin" };
}

/* ── Users Tab ── */
function UsersTab({ token, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${STRAPI_URL}/api/kibira-users?pagination[pageSize]=100&sort=createdAt:desc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data?.data || []);
    } catch {} finally { setLoadingData(false); }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleRole = async (userEntry) => {
    const newRole = userEntry.role === "admin" ? "user" : "admin";
    const action = newRole === "admin" ? "promote to Admin" : "demote to User";
    if (!confirm(`Are you sure you want to ${action}: ${userEntry.fullName || userEntry.email}?`)) return;
    setTogglingId(userEntry.id);
    try {
      const res = await fetch(`${STRAPI_URL}/api/kibira-users/${userEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: { role: newRole } }),
      });
      if (res.ok) fetchUsers();
    } catch {} finally { setTogglingId(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
          Registered Users ({users.length})
        </h2>
      </div>
      {loadingData ? (
        <div className="text-center py-12 text-[#6b7c6b]">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-[#6b7c6b]">No users yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e7eb]">
                <th className="text-left py-3 px-4 font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] hidden md:table-cell">Company</th>
                <th className="text-left py-3 px-4 font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] hidden md:table-cell">Position</th>
                <th className="text-left py-3 px-4 font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] hidden sm:table-cell">Phone</th>
                <th className="text-left py-3 px-4 font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.email === currentUser?.email;
                const isAdmin = u.role === "admin";
                return (
                  <tr key={u.id} className="border-b border-[#f0f0f0] hover:bg-[#f0fdf4]/50 transition-colors">
                    <td className="py-3 px-4 font-[family-name:var(--font-body)]">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isAdmin ? "bg-[#d97706]" : "bg-[#2d6a4f]"}`}>
                          {(u.fullName || "?")[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-[#1a2e1a]">{u.fullName || "—"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#6b7c6b] font-[family-name:var(--font-body)]">{u.email}</td>
                    <td className="py-3 px-4 font-[family-name:var(--font-body)]">
                      <button
                        onClick={() => handleToggleRole(u)}
                        disabled={isSelf || togglingId === u.id}
                        title={isSelf ? "You cannot change your own role" : `Click to ${isAdmin ? "demote to user" : "promote to admin"}`}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                          isAdmin
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        } ${isSelf ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${togglingId === u.id ? "opacity-50" : ""}`}
                      >
                        {togglingId === u.id ? "..." : isAdmin ? "Admin" : "User"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-[#6b7c6b] font-[family-name:var(--font-body)] hidden md:table-cell">{u.company || "—"}</td>
                    <td className="py-3 px-4 text-[#6b7c6b] font-[family-name:var(--font-body)] hidden md:table-cell">{u.position || "—"}</td>
                    <td className="py-3 px-4 text-[#6b7c6b] font-[family-name:var(--font-body)] hidden sm:table-cell">{u.phone || "—"}</td>
                    <td className="py-3 px-4 text-[#6b7c6b] font-[family-name:var(--font-body)] text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Chats Tab ── */
function ChatsTab({ token }) {
  const [chats, setChats] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedChat, setExpandedChat] = useState(null);

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch(`${STRAPI_URL}/api/kibira-chats?pagination[pageSize]=100&sort=createdAt:desc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setChats(data?.data || []);
    } catch {} finally { setLoadingData(false); }
  }, [token]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  // Strip chart blocks for preview
  const stripCharts = (text) => text?.replace(/\|\|\|CHART\|\|\|[\s\S]*?\|\|\|END_CHART\|\|\|/g, "[Chart]") || "";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
          AI Chat Logs ({chats.length})
        </h2>
      </div>
      {loadingData ? (
        <div className="text-center py-12 text-[#6b7c6b]">Loading chats...</div>
      ) : chats.length === 0 ? (
        <div className="text-center py-12 text-[#6b7c6b]">No chat logs yet.</div>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => (
            <div key={chat.id} className="border border-[#e5e7eb] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedChat(expandedChat === chat.id ? null : chat.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f0fdf4]/50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[#f0fdf4] flex items-center justify-center text-xs font-bold text-[#2d6a4f] flex-shrink-0 font-[family-name:var(--font-body)]">
                  {(chat.userName || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1a2e1a] font-[family-name:var(--font-body)]">{chat.userName || "Anonymous"}</span>
                    <span className="text-[10px] text-[#9ca3af] font-[family-name:var(--font-body)]">{chat.userEmail || ""}</span>
                  </div>
                  <p className="text-xs text-[#6b7c6b] truncate font-[family-name:var(--font-body)]">{chat.userMessage?.slice(0, 100)}</p>
                </div>
                <span className="text-[10px] text-[#9ca3af] flex-shrink-0 font-[family-name:var(--font-body)]">
                  {chat.createdAt ? new Date(chat.createdAt).toLocaleDateString() : ""}
                </span>
                <svg width="16" height="16" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24" className={`flex-shrink-0 transition-transform ${expandedChat === chat.id ? "rotate-180" : ""}`}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {expandedChat === chat.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-[#e5e7eb]">
                  <div className="mt-3">
                    <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] font-semibold mb-1 font-[family-name:var(--font-body)]">User Message</p>
                    <div className="bg-[#f0fdf4] rounded-lg px-3 py-2 text-sm text-[#1a2e1a] font-[family-name:var(--font-body)]">
                      {chat.userMessage}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] font-semibold mb-1 font-[family-name:var(--font-body)]">AI Response</p>
                    <div className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] max-h-64 overflow-y-auto font-[family-name:var(--font-body)] whitespace-pre-wrap">
                      {stripCharts(chat.aiResponse)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Knowledge Base Tab ── */
function KnowledgeTab({ token }) {
  const [entries, setEntries] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "other", source: "" });
  const [saving, setSaving] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [pdfInfo, setPdfInfo] = useState(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`${STRAPI_URL}/api/kibira-knowledges?pagination[pageSize]=100&sort=createdAt:desc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEntries(data?.data || []);
    } catch {} finally { setLoadingData(false); }
  }, [token]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/kibira-knowledges`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: { ...form, active: true } }),
      });
      if (res.ok) {
        setForm({ title: "", content: "", category: "other", source: "" });
        setPdfFile(null);
        setPdfInfo(null);
        setShowForm(false);
        fetchEntries();
      }
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this knowledge entry?")) return;
    try {
      await fetch(`${STRAPI_URL}/api/kibira-knowledges/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEntries();
    } catch {}
  };

  const handleToggle = async (entry) => {
    try {
      await fetch(`${STRAPI_URL}/api/kibira-knowledges/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: { active: !entry.active } }),
      });
      fetchEntries();
    } catch {}
  };

  const handlePdfExtract = async () => {
    if (!pdfFile) return;
    setExtracting(true);
    setPdfInfo(null);
    try {
      const formData = new FormData();
      formData.append("file", pdfFile);
      const res = await fetch("/api/extract-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to extract PDF");
        return;
      }
      setForm((prev) => ({
        ...prev,
        content: data.text,
        title: prev.title || data.title || pdfFile.name.replace(/\.pdf$/i, ""),
        source: prev.source || pdfFile.name,
      }));
      setPdfInfo({ pages: data.pages, chars: data.text.length });
    } catch {
      alert("Failed to process PDF. Please try again.");
    } finally { setExtracting(false); }
  };

  const categories = ["deforestation", "climate", "urban", "carbon", "biodiversity", "policy", "research", "other"];
  const catColors = {
    deforestation: "bg-red-100 text-red-700",
    climate: "bg-blue-100 text-blue-700",
    urban: "bg-purple-100 text-purple-700",
    carbon: "bg-green-100 text-green-700",
    biodiversity: "bg-amber-100 text-amber-700",
    policy: "bg-indigo-100 text-indigo-700",
    research: "bg-cyan-100 text-cyan-700",
    other: "bg-gray-100 text-gray-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
            Knowledge Base ({entries.length})
          </h2>
          <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">
            Add documents and knowledge that Dr. Kibira will use to enrich responses.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-sm font-semibold transition-colors font-[family-name:var(--font-body)]"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Knowledge
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-6 p-5 bg-[#f0fdf4] border border-[#d1e7d1] rounded-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Uganda Forest Cover Report 2024"
              className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)]"
              required
            />
          </div>

          {/* PDF Upload */}
          <div className="border border-dashed border-[#b5c9b5] rounded-xl p-4 bg-white/60">
            <label className="block text-sm font-medium text-[#1a2e1a] mb-2 font-[family-name:var(--font-body)]">
              Upload PDF <span className="font-normal text-[#6b7c6b]">(optional — extracts text automatically)</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#d1d5db] bg-white hover:bg-[#f9fafb] cursor-pointer transition-colors text-sm font-[family-name:var(--font-body)]">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                {pdfFile ? pdfFile.name : "Choose PDF..."}
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => { setPdfFile(e.target.files?.[0] || null); setPdfInfo(null); }}
                />
              </label>
              {pdfFile && (
                <button
                  type="button"
                  onClick={handlePdfExtract}
                  disabled={extracting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-sm font-semibold transition-colors disabled:opacity-50 font-[family-name:var(--font-body)]"
                >
                  {extracting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Extracting...
                    </>
                  ) : "Extract Text"}
                </button>
              )}
              {pdfFile && !extracting && (
                <button type="button" onClick={() => { setPdfFile(null); setPdfInfo(null); }} className="text-xs text-[#9ca3af] hover:text-red-500 transition-colors">
                  Remove
                </button>
              )}
            </div>
            {pdfInfo && (
              <p className="mt-2 text-xs text-[#2d6a4f] font-[family-name:var(--font-body)]">
                Extracted {pdfInfo.chars.toLocaleString()} characters from {pdfInfo.pages} page{pdfInfo.pages !== 1 ? "s" : ""}. Review content below.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">
              Knowledge Content * <span className="font-normal text-[#6b7c6b]">(paste text, data, or key findings)</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Paste climate data, research findings, policy documents, or any relevant information here..."
              rows={6}
              className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] resize-y"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">Source</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="e.g., FAO Report 2024"
                className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)]"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-sm font-semibold transition-colors disabled:opacity-50 font-[family-name:var(--font-body)]"
            >
              {saving ? "Saving..." : "Save Knowledge"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 rounded-xl border border-[#d1d5db] text-sm text-[#6b7c6b] hover:bg-white transition-colors font-[family-name:var(--font-body)]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loadingData ? (
        <div className="text-center py-12 text-[#6b7c6b]">Loading knowledge base...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-[#6b7c6b] font-[family-name:var(--font-body)]">No knowledge entries yet.</p>
          <p className="text-xs text-[#9ca3af] mt-1 font-[family-name:var(--font-body)]">Add climate data, reports, or research findings for Dr. Kibira to use.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className={`border rounded-xl p-4 transition-colors ${entry.active ? "border-[#d1e7d1] bg-white" : "border-[#e5e7eb] bg-gray-50 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{entry.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${catColors[entry.category] || catColors.other}`}>
                      {entry.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7c6b] line-clamp-2 font-[family-name:var(--font-body)]">{entry.content}</p>
                  {entry.source && (
                    <p className="text-[10px] text-[#9ca3af] mt-1 font-[family-name:var(--font-body)]">Source: {entry.source}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(entry)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-colors font-[family-name:var(--font-body)] ${entry.active ? "bg-[#f0fdf4] text-[#2d6a4f] hover:bg-[#dcfce7]" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    {entry.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-[#9ca3af] hover:text-red-500 transition-colors"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Dashboard Stats ── */
function StatsCards({ token }) {
  const [stats, setStats] = useState({ users: 0, chats: 0, knowledge: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, chatsRes, knowledgeRes] = await Promise.all([
          fetch(`${STRAPI_URL}/api/kibira-users?pagination[pageSize]=1`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${STRAPI_URL}/api/kibira-chats?pagination[pageSize]=1`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${STRAPI_URL}/api/kibira-knowledges?pagination[pageSize]=1`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [usersData, chatsData, knowledgeData] = await Promise.all([usersRes.json(), chatsRes.json(), knowledgeRes.json()]);
        setStats({
          users: usersData?.meta?.pagination?.total || 0,
          chats: chatsData?.meta?.pagination?.total || 0,
          knowledge: knowledgeData?.meta?.pagination?.total || 0,
        });
      } catch {}
    }
    fetchStats();
  }, [token]);

  const cards = [
    { label: "Registered Users", value: stats.users, icon: "👥", color: "bg-[#f0fdf4] border-[#d1e7d1]" },
    { label: "AI Conversations", value: stats.chats, icon: "💬", color: "bg-[#eff6ff] border-[#bfdbfe]" },
    { label: "Knowledge Entries", value: stats.knowledge, icon: "📚", color: "bg-[#fef3c7] border-[#fde68a]" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{card.icon}</span>
            <div>
              <p className="text-2xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{card.value}</p>
              <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Admin Page ── */
export default function AdminPage() {
  const { isAdmin, user, loading } = useAdminGuard();
  const [tab, setTab] = useState("users");
  const { getToken } = useAuth();
  const token = typeof window !== "undefined" ? getToken() : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7faf6] flex items-center justify-center">
        <div className="text-[#6b7c6b] font-[family-name:var(--font-body)]">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const tabs = [
    { id: "users", label: "Users", icon: "👥" },
    { id: "chats", label: "AI Chats", icon: "💬" },
    { id: "knowledge", label: "Knowledge Base", icon: "📚" },
  ];

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      {/* Header */}
      <header className="bg-[#0f2618] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg">🌿</span>
              <span className="font-[family-name:var(--font-display)] text-base font-bold">KibiraAI</span>
            </Link>
            <span className="text-white/30 mx-2">/</span>
            <span className="text-sm text-white/70 font-[family-name:var(--font-body)]">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white/90 transition-colors font-[family-name:var(--font-body)]">
              ← Back to App
            </Link>
            <div className="w-8 h-8 rounded-full bg-[#2d6a4f] flex items-center justify-center text-white text-xs font-bold">
              {(user?.fullName || "A")[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <StatsCards token={token} />

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#e5e7eb] mb-6 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors font-[family-name:var(--font-body)] ${
                tab === t.id ? "bg-[#2d6a4f] text-white shadow-sm" : "text-[#6b7c6b] hover:text-[#1a2e1a] hover:bg-[#f0fdf4]"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
          {tab === "users" && <UsersTab token={token} currentUser={user} />}
          {tab === "chats" && <ChatsTab token={token} />}
          {tab === "knowledge" && <KnowledgeTab token={token} />}
        </div>
      </div>
    </div>
  );
}
