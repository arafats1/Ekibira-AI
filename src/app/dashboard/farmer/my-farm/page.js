"use client";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import PaymentModal from "../../../components/PaymentModal";

const COMMON_CROPS = [
  "Maize", "Beans", "Cassava", "Sweet Potatoes", "Rice", "Sorghum", "Millet",
  "Groundnuts", "Soybeans", "Coffee", "Bananas", "Irish Potatoes", "Tomatoes",
  "Onions", "Cabbage", "Sunflower", "Sesame", "Cotton", "Wheat", "Peas",
];

const SPACING_OPTIONS = {
  Maize: ["75cm × 25cm (standard)", "90cm × 30cm (wide)"],
  Beans: ["45cm × 10cm (bush)", "60cm × 20cm (climbing)"],
  Cassava: ["100cm × 100cm (standard)", "120cm × 80cm (wide)"],
  "Sweet Potatoes": ["90cm × 30cm (standard)", "100cm × 25cm (dense)"],
  Rice: ["20cm × 20cm (transplant)", "25cm × 25cm (SRI method)"],
  Sorghum: ["75cm × 15cm (standard)", "60cm × 20cm (dense)"],
  Millet: ["45cm × 15cm (rows)", "30cm × 30cm (hills)"],
  Groundnuts: ["45cm × 15cm (standard)", "30cm × 10cm (dense)"],
  Soybeans: ["60cm × 5cm (drill)", "45cm × 10cm (rows)"],
  Coffee: ["300cm × 300cm (standard)", "250cm × 250cm (intensive)"],
  Bananas: ["300cm × 300cm (standard)", "400cm × 400cm (wide)"],
  "Irish Potatoes": ["75cm × 30cm (standard)", "60cm × 25cm (dense)"],
  Tomatoes: ["60cm × 45cm (staked)", "90cm × 60cm (ground)"],
  Onions: ["30cm × 10cm (standard)", "20cm × 10cm (dense)"],
  Cabbage: ["60cm × 45cm (standard)", "50cm × 40cm (dense)"],
  Sunflower: ["75cm × 25cm (standard)", "60cm × 30cm (dense)"],
  Sesame: ["45cm × 15cm (rows)", "60cm × 10cm (drill)"],
  Cotton: ["90cm × 30cm (standard)", "75cm × 25cm (dense)"],
  Wheat: ["25cm × broadcast (drill)", "20cm × broadcast (dense)"],
  Peas: ["45cm × 10cm (bush)", "60cm × 15cm (climbing)"],
};

const PRIORITY_STYLES = {
  urgent: "bg-red-50 border-red-200 text-red-800",
  important: "bg-amber-50 border-amber-200 text-amber-800",
  routine: "bg-green-50 border-green-200 text-green-800",
};

const SEVERITY_STYLES = {
  critical: "bg-red-100 border-red-300 text-red-900",
  warning: "bg-orange-100 border-orange-300 text-orange-900",
  info: "bg-blue-100 border-blue-300 text-blue-900",
};

// Crop stage visual: returns emoji + bg color based on crop type and growth stage
const CROP_ICONS = {
  maize: "🌽", beans: "🫘", cassava: "🥔", "sweet potatoes": "🍠", rice: "🌾",
  sorghum: "🌾", millet: "🌾", groundnuts: "🥜", soybeans: "🫘", coffee: "☕",
  bananas: "🍌", "irish potatoes": "🥔", tomatoes: "🍅", onions: "🧅",
  cabbage: "🥬", sunflower: "🌻", sesame: "🌱", cotton: "🧶", wheat: "🌾", peas: "🫛",
};
const STAGE_CONFIG = {
  germination: { emoji: "🌱", label: "Sprouting", bg: "from-lime-100 to-lime-50", ring: "ring-lime-300" },
  seedling: { emoji: "🌿", label: "Seedling", bg: "from-green-100 to-emerald-50", ring: "ring-green-300" },
  vegetative: { emoji: "🪴", label: "Growing", bg: "from-emerald-100 to-green-50", ring: "ring-emerald-400" },
  flowering: { emoji: "🌸", label: "Flowering", bg: "from-pink-100 to-rose-50", ring: "ring-pink-300" },
  fruiting: { emoji: "🍃", label: "Fruiting", bg: "from-amber-100 to-yellow-50", ring: "ring-amber-300" },
  maturity: { emoji: "🌾", label: "Mature", bg: "from-amber-200 to-orange-100", ring: "ring-amber-400" },
  harvest: { emoji: "✂️", label: "Ready!", bg: "from-yellow-200 to-amber-100", ring: "ring-yellow-400" },
};
function CropStageImage({ cropName, growthStage, size = "md" }) {
  const stage = (growthStage || "").toLowerCase();
  const crop = (cropName || "").toLowerCase();
  const stageKey = Object.keys(STAGE_CONFIG).find(k => stage.includes(k)) || "vegetative";
  const cfg = STAGE_CONFIG[stageKey];
  const cropEmoji = CROP_ICONS[crop] || CROP_ICONS[Object.keys(CROP_ICONS).find(k => crop.includes(k))] || "🌱";
  const dims = size === "sm" ? "w-12 h-12" : "w-16 h-16";
  const emojiSize = size === "sm" ? "text-lg" : "text-2xl";
  const stageSize = size === "sm" ? "text-[7px]" : "text-[8px]";
  return (
    <div className={`${dims} rounded-xl bg-gradient-to-br ${cfg.bg} ring-2 ${cfg.ring} flex flex-col items-center justify-center flex-shrink-0 shadow-sm`}>
      <span className={emojiSize}>{stageKey === "harvest" ? cfg.emoji : cropEmoji}</span>
      <span className={`${stageSize} font-bold text-[#2d6a4f] font-[family-name:var(--font-body)] leading-none mt-0.5`}>{cfg.label}</span>
    </div>
  );
}

// Format YYYY-MM-DD to dd-mm-yyyy
const fmtDate = (d) => {
  if (!d) return "—";
  const parts = String(d).slice(0, 10).split("-");
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : d;
};

// Parse DD-MM-YYYY string into a Date object
const parseDMY = (d) => {
  if (!d) return null;
  const s = String(d).slice(0, 10);
  const parts = s.split("-");
  if (parts.length !== 3) return null;
  // If first part is 4 digits, it's YYYY-MM-DD
  if (parts[0].length === 4) return new Date(s);
  // Otherwise DD-MM-YYYY
  return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
};

// Ensure date displays as DD-MM-YYYY regardless of input format
const displayDMY = (d) => {
  if (!d) return "—";
  const s = String(d).slice(0, 10);
  const parts = s.split("-");
  if (parts.length !== 3) return d;
  // If first part is 4 digits (YYYY-MM-DD), reverse it
  if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  // Already DD-MM-YYYY
  return s;
};

export default function MyFarmPage() {
  const { user, loading, logout, getToken } = useAuth();
  const router = useRouter();

  // State
  const [crops, setCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingCrop, setAddingCrop] = useState(false);
  const [activeTab, setActiveTab] = useState("plan"); // plan | crops | harvest
  const [formError, setFormError] = useState(null);
  const [doneActions, setDoneActions] = useState(new Set()); // track completed daily actions
  const [marketData, setMarketData] = useState({}); // { cropId: { loading, prices, error } }
  const [harvestModal, setHarvestModal] = useState(null); // crop being harvested
  const [harvestForm, setHarvestForm] = useState({ harvestDate: new Date().toISOString().split("T")[0], harvestYield: "", yieldUnit: "kg" });
  const [yieldChat, setYieldChat] = useState({}); // { cropId: { messages: [], loading, open } }

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState({ open: false, context: "crop", cropData: null });
  const [pendingCropForm, setPendingCropForm] = useState(null); // store form data when payment needed

  // Floating chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // saved chats from backend
  const [activeChatId, setActiveChatId] = useState(null); // documentId of current chat
  const [showChatList, setShowChatList] = useState(false); // toggle chat history list
  const [loadingHistory, setLoadingHistory] = useState(false);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  useEffect(() => {
    if (chatOpen && chatInputRef.current && !showChatList) chatInputRef.current.focus();
  }, [chatOpen, showChatList]);

  // Load chat history when chat opens
  useEffect(() => {
    if (chatOpen && chatHistory.length === 0) {
      loadChatHistory();
    }
  }, [chatOpen]);

  const loadChatHistory = async () => {
    try {
      const token = getToken();
      if (!token) return;
      setLoadingHistory(true);
      const res = await fetch("/api/chat-history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data.chats || []);
      }
    } catch { /* ignore */ }
    setLoadingHistory(false);
  };

  const saveChat = async (messages, chatId) => {
    try {
      const token = getToken();
      if (!token || messages.length < 2) return null;
      const res = await fetch("/api/chat-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId, messages }),
      });
      if (res.ok) {
        const data = await res.json();
        loadChatHistory(); // refresh list
        return data.chatId;
      }
    } catch { /* ignore */ }
    return chatId;
  };

  const loadChat = (chat) => {
    setChatMessages(chat.messages || []);
    setActiveChatId(chat.documentId);
    setShowChatList(false);
  };

  const startNewChat = () => {
    setChatMessages([]);
    setActiveChatId(null);
    setShowChatList(false);
  };

  const sendChat = async (msg) => {
    const text = (msg || chatInput).trim();
    if (!text || chatLoading) return;
    setChatInput("");
    const userMsg = { role: "user", content: text };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatLoading(true);
    try {
      const token = getToken();
      const res = await fetch("/api/farmer-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, history: updatedMessages }),
      });
      const data = await res.json();
      if (data.error === "limit_reached" || res.status === 429) {
        const limitMsg = data.reply || "🔒 You've used your 5 free messages for today. Upgrade for unlimited!";
        setChatMessages(prev => [...prev, { role: "assistant", content: limitMsg }]);
        setChatLoading(false);
        // Show payment modal after a short delay
        setTimeout(() => setPaymentModal({ open: true, context: "chat", cropData: null }), 1500);
        return;
      }
      const reply = data.reply || "Sorry, I couldn't process that. Please try again.";
      const finalMessages = [...updatedMessages, { role: "assistant", content: reply }];
      setChatMessages(finalMessages);
      // Auto-save after each assistant reply
      const newId = await saveChat(finalMessages, activeChatId);
      if (newId && !activeChatId) setActiveChatId(newId);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Network error. Please try again." }]);
    }
    setChatLoading(false);
  };

  // Fetch market prices for a harvested crop
  const fetchMarketPrice = async (crop) => {
    if (marketData[crop.id]?.prices) return; // already loaded
    setMarketData(prev => ({ ...prev, [crop.id]: { loading: true } }));
    try {
      const res = await fetch("/api/market-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName: crop.cropName,
          location: crop.location,
          area: crop.area,
          areaUnit: crop.areaUnit,
          harvestDate: crop.harvestDate,
          expectedYieldLow: crop.expectedYieldLow,
          expectedYieldHigh: crop.expectedYieldHigh,
        }),
      });
      const data = await res.json();
      if (data.prices) {
        setMarketData(prev => ({ ...prev, [crop.id]: { prices: data.prices } }));
      } else {
        setMarketData(prev => ({ ...prev, [crop.id]: { error: data.error || "Failed" } }));
      }
    } catch {
      setMarketData(prev => ({ ...prev, [crop.id]: { error: "Network error" } }));
    }
  };

  // Add crop form
  const [cropForm, setCropForm] = useState({
    cropName: "", variety: "", area: "", areaUnit: "acres",
    plantingDate: new Date().toISOString().split("T")[0],
    location: "", notes: "", seedQuantity: "", seedUnit: "kg", spacing: "",
  });

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Load crops
  const fetchCrops = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoadingCrops(true);
    try {
      const res = await fetch("/api/farm-crops", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.crops) setCrops(data.crops);
    } catch { /* silently fail */ }
    setLoadingCrops(false);
  }, [getToken]);

  useEffect(() => {
    if (user) fetchCrops();
  }, [user, fetchCrops]);

  // Generate AI plan
  const generatePlan = async () => {
    const growingCrops = crops.filter(c => c.status === "growing");
    if (growingCrops.length === 0) return;

    // Use the location from the first crop (or most common)
    const location = growingCrops[0]?.location || "Uganda";

    setLoadingPlan(true);
    try {
      const res = await fetch("/api/farm-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crops: growingCrops, location }),
      });
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
        setDoneActions(new Set());

        // Sync subscription endDates with AI harvest estimates
        if (data.plan.cropStatus) {
          try {
            const token = getToken();
            if (token) {
              // Fetch all active per-crop subscriptions via our API
              const subRes = await fetch("/api/subscription?includeSubs=true", {
                headers: { Authorization: `Bearer ${token}` },
              });
              const subInfo = subRes.ok ? await subRes.json() : null;
              if (subInfo?.subscriptions) {
                for (const sub of subInfo.subscriptions) {
                  if (sub.type !== "per-crop") continue;
                  // Find matching AI crop status
                  const match = data.plan.cropStatus.find(cs => {
                    if (sub.cropDocumentId) {
                      const crop = growingCrops.find(c => c.documentId === sub.cropDocumentId);
                      return crop && crop.cropName.toLowerCase() === cs.cropName.toLowerCase();
                    }
                    return sub.cropName && cs.cropName.toLowerCase() === sub.cropName.toLowerCase();
                  });
                  if (match?.estimatedHarvestDate) {
                    const hd = parseDMY(match.estimatedHarvestDate);
                    if (hd) {
                      hd.setDate(hd.getDate() + 14);
                      const newEnd = hd.toISOString().split("T")[0];
                      if (sub.endDate !== newEnd) {
                        fetch("/api/subscription", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ subscriptionDocumentId: sub.documentId, endDate: newEnd }),
                        }).catch(() => {});
                      }
                    }
                  }
                }
              }
            }
          } catch {}
        }
      }
    } catch { /* silently fail */ }
    setLoadingPlan(false);
  };

  // Auto-generate plan when crops are loaded
  useEffect(() => {
    const growing = crops.filter(c => c.status === "growing");
    if (growing.length > 0 && !plan && !loadingPlan) {
      generatePlan();
    }
  }, [crops]);

  // Add crop
  const handleAddCrop = async (e) => {
    e.preventDefault();
    setFormError(null);
    const token = getToken();
    if (!token) return;

    if (!cropForm.cropName || !cropForm.plantingDate || !cropForm.location) {
      setFormError("Crop name, planting date, and location are required.");
      return;
    }

    setAddingCrop(true);
    try {
      const res = await fetch("/api/farm-crops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cropForm),
      });
      const data = await res.json();
      if (data.error === "crop_limit") {
        setPendingCropForm({ ...cropForm });
        setPaymentModal({ open: true, context: "crop", cropData: { cropName: cropForm.cropName, plantingDate: cropForm.plantingDate } });
        setAddingCrop(false);
        return;
      }
      if (data.crop) {
        setCrops(prev => [data.crop, ...prev]);
        setCropForm({
          cropName: "", variety: "", area: "", areaUnit: "acres",
          plantingDate: new Date().toISOString().split("T")[0],
          location: cropForm.location, // keep the location for convenience
          notes: "",
        });
        setShowAddForm(false);
        setPlan(null); // Reset plan to force regeneration
        setActiveTab("plan");
      } else {
        setFormError(data.error || "Failed to add crop");
      }
    } catch {
      setFormError("Network error. Please try again.");
    }
    setAddingCrop(false);
  };

  // Update crop status
  const updateCropStatus = async (id, status, extras = {}) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/farm-crops", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status, ...extras }),
      });
      const data = await res.json();
      if (data.crop) {
        setCrops(prev => prev.map(c => c.id === id ? { ...c, ...data.crop } : c));
        setPlan(null); // Reset plan
      } else {
        alert(data.error || "Failed to update crop. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  // Delete crop
  const deleteCrop = async (id) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/farm-crops?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCrops(prev => prev.filter(c => c.id !== id));
        setPlan(null);
      } else {
        alert(data.error || "Failed to delete crop. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f7faf6] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#2d6a4f]">
          <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
          <span className="font-[family-name:var(--font-body)] text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  const growingCrops = crops.filter(c => c.status === "growing");
  const oldestGrowingCropId = growingCrops.length > 0 ? growingCrops[growingCrops.length - 1].id : null;
  const harvestedCrops = crops.filter(c => c.status === "harvested");
  const daysSince = (dateStr) => Math.max(0, Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24)));

  // Submit harvest with actual yield
  const submitHarvest = async () => {
    if (!harvestModal) return;
    const yieldVal = parseFloat(harvestForm.harvestYield);
    if (!harvestForm.harvestDate) { alert("Please enter the harvest date."); return; }
    if (!yieldVal || yieldVal <= 0) { alert("Please enter the actual yield amount."); return; }
    await updateCropStatus(harvestModal.id, "harvested", {
      harvestDate: harvestForm.harvestDate,
      harvestYield: yieldVal,
      yieldUnit: harvestForm.yieldUnit,
    });
    setHarvestModal(null);
  };

  // Yield chat — opens a conversation about low yield for a specific crop
  const startYieldChat = (crop) => {
    if (yieldChat[crop.id]?.messages?.length > 0) {
      // Already started, just toggle open
      setYieldChat(prev => ({ ...prev, [crop.id]: { ...prev[crop.id], open: !prev[crop.id].open } }));
      return;
    }
    const initMsg = `My ${crop.cropName} crop in ${crop.location} (${crop.area || "unknown"} ${crop.areaUnit || "acres"}, seed: ${crop.seedQuantity || "?"} ${crop.seedUnit || "kg"}, spacing: ${crop.spacing || "?"}, planted ${crop.plantingDate}, harvested ${crop.harvestDate}) produced only ${crop.harvestYield} ${crop.yieldUnit || "kg"} — but the expected yield was ${crop.expectedYieldLow}–${crop.expectedYieldHigh} kg. That is significantly below expectations. Please analyze: 1) What likely went wrong, 2) When is the best time to replant this crop based on forecast conditions, 3) What I should do differently next time to improve yield.`;
    setYieldChat(prev => ({ ...prev, [crop.id]: { messages: [{ role: "user", content: initMsg }], loading: true, open: true, cropContext: [crop] } }));
    sendYieldMessage(crop.id, initMsg, [], [crop]);
  };

  const sendYieldMessage = async (cropId, text, prevMessages, cropContext) => {
    try {
      const res = await fetch("/api/farmer-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: prevMessages, cropContext }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't process that.";
      setYieldChat(prev => ({
        ...prev,
        [cropId]: { ...prev[cropId], messages: [...(prev[cropId]?.messages || []), { role: "assistant", content: reply }], loading: false },
      }));
    } catch {
      setYieldChat(prev => ({
        ...prev,
        [cropId]: { ...prev[cropId], messages: [...(prev[cropId]?.messages || []), { role: "assistant", content: "Network error. Please try again." }], loading: false },
      }));
    }
  };

  const sendYieldFollowUp = (cropId, text) => {
    if (!text.trim()) return;
    const prev = yieldChat[cropId];
    if (!prev) return;
    const userMsg = { role: "user", content: text.trim() };
    const newMessages = [...prev.messages, userMsg];
    setYieldChat(p => ({ ...p, [cropId]: { ...p[cropId], messages: newMessages, loading: true, input: "" } }));
    sendYieldMessage(cropId, text.trim(), newMessages, prev.cropContext);
  };

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/farmer" className="text-sm text-[#6b7c6b] hover:text-[#2d6a4f] font-[family-name:var(--font-body)]">← Dashboard</Link>
            <span className="text-[#d1d5db]">|</span>
            <span className="text-2xl">🌱</span>
            <span className="font-[family-name:var(--font-display)] text-xl font-bold text-[#1b4332]">My Farm</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold">
              {user.fullName?.charAt(0)?.toUpperCase() || "F"}
            </div>
            <button onClick={() => { logout(); router.push("/"); }} className="text-xs text-[#6b7c6b] hover:text-red-600 font-[family-name:var(--font-body)] px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header + Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
              🌱 My Farm
            </h1>
            <p className="text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)] text-sm">
              Track your crops, get weather-matched daily action items, and plan your harvests.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm transition-colors font-[family-name:var(--font-body)] flex items-center gap-2"
          >
            <span>+</span> Add Crop
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-[#e5e7eb]">
            <p className="text-2xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{growingCrops.length}</p>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Growing</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e5e7eb]">
            <p className="text-2xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{harvestedCrops.length}</p>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Harvested</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e5e7eb]">
            <p className={`text-2xl font-bold font-[family-name:var(--font-display)] ${(plan?.riskAlerts?.length || 0) > 0 ? "text-amber-600" : "text-[#1a2e1a]"}`}>
              {plan?.riskAlerts?.length || 0}
            </p>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Active Alerts</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e5e7eb]">
            <p className="text-2xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
              {plan?.dailyActions?.length || 0}
            </p>
            <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Today&apos;s Actions</p>
          </div>
        </div>

        {/* Add Crop Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Add New Crop</h2>
                <button onClick={() => setShowAddForm(false)} className="text-[#6b7c6b] hover:text-red-600 text-xl">&times;</button>
              </div>
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-[family-name:var(--font-body)]">{formError}</div>
              )}
              <form onSubmit={handleAddCrop} className="space-y-4">
                {/* Crop Name */}
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Crop *</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {COMMON_CROPS.slice(0, 12).map(c => (
                      <button
                        key={c} type="button"
                        onClick={() => setCropForm(f => ({ ...f, cropName: c }))}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all font-[family-name:var(--font-body)] ${cropForm.cropName === c ? 'bg-amber-600 text-white border-amber-600' : 'bg-gray-50 text-[#6b7c6b] border-gray-200 hover:border-amber-300'}`}
                      >{c}</button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={cropForm.cropName}
                    onChange={e => setCropForm(f => ({ ...f, cropName: e.target.value }))}
                    placeholder="Or type crop name..."
                    className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                  />
                </div>

                {/* Variety */}
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Variety (optional)</label>
                  <input
                    type="text"
                    value={cropForm.variety}
                    onChange={e => setCropForm(f => ({ ...f, variety: e.target.value }))}
                    placeholder="e.g., Longe 5, NASE 14, K132..."
                    className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                  />
                </div>

                {/* Area + Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Farm Size</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cropForm.area}
                      onChange={e => setCropForm(f => ({ ...f, area: e.target.value }))}
                      placeholder="e.g., 2"
                      className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Unit</label>
                    <select
                      value={cropForm.areaUnit}
                      onChange={e => setCropForm(f => ({ ...f, areaUnit: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                    >
                      <option value="acres">Acres</option>
                      <option value="hectares">Hectares</option>
                      <option value="sqm">Sq Meters</option>
                    </select>
                  </div>
                </div>

                {/* Planting Date */}
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Seed Quantity</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="0.1"
                      value={cropForm.seedQuantity}
                      onChange={e => setCropForm(f => ({ ...f, seedQuantity: e.target.value }))}
                      placeholder="e.g., 10"
                      className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                    />
                    <select
                      value={cropForm.seedUnit}
                      onChange={e => setCropForm(f => ({ ...f, seedUnit: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="pieces">Pieces/Seeds</option>
                      <option value="bags">Bags</option>
                      <option value="tins">Tins</option>
                    </select>
                  </div>
                </div>

                {/* Plant Spacing */}
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Plant Spacing</label>
                  {(() => {
                    const opts = SPACING_OPTIONS[cropForm.cropName] || (cropForm.cropName ? ["60cm × 30cm (standard)", "90cm × 45cm (wide)"] : []);
                    return opts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {opts.map(s => (
                        <button
                          key={s} type="button"
                          onClick={() => setCropForm(f => ({ ...f, spacing: s }))}
                          className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all font-[family-name:var(--font-body)] ${cropForm.spacing === s ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' : 'bg-gray-50 text-[#6b7c6b] border-gray-200 hover:border-[#2d6a4f]'}`}
                        >{s}</button>
                      ))}
                    </div>
                    ) : null;
                  })()}
                  <input
                    type="text"
                    value={cropForm.spacing}
                    onChange={e => setCropForm(f => ({ ...f, spacing: e.target.value }))}
                    placeholder="e.g., 75cm × 25cm or type custom spacing..."
                    className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                  />
                </div>

                {/* Planting Date */}
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Planting Date *</label>
                  <input
                    type="date"
                    value={cropForm.plantingDate}
                    onChange={e => setCropForm(f => ({ ...f, plantingDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Location *</label>
                  <input
                    type="text"
                    value={cropForm.location}
                    onChange={e => setCropForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g., Lira, Kabale, Gulu..."
                    className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)]"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">Notes (optional)</label>
                  <textarea
                    value={cropForm.notes}
                    onChange={e => setCropForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="Any details about soil, fertilizer used, etc..."
                    className="w-full px-3 py-2 rounded-lg border border-[#d1d5db] focus:border-amber-500 outline-none text-sm font-[family-name:var(--font-body)] resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2.5 border border-[#d1d5db] rounded-xl text-sm font-[family-name:var(--font-body)] text-[#6b7c6b] hover:bg-gray-50"
                  >Cancel</button>
                  <button
                    type="submit"
                    disabled={addingCrop}
                    className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm font-[family-name:var(--font-body)] disabled:opacity-50"
                  >{addingCrop ? "Adding..." : "Add Crop"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-[#e5e7eb] p-1 mb-6 w-fit overflow-x-auto">
          {[
            { key: "plan", label: "📋 Today's Plan", count: plan?.dailyActions?.length },
            { key: "crops", label: "🌾 My Crops", count: growingCrops.length },
            { key: "harvest", label: "📦 Harvest Log", count: harvestedCrops.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-[family-name:var(--font-body)] transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-[#6b7c6b] hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB: Today's Plan ─── */}
        {activeTab === "plan" && (
          <div>
            {growingCrops.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center">
                <span className="text-5xl mb-4 block">🌱</span>
                <h3 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">Add your first crop</h3>
                <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-4">
                  Add the crops you&apos;re currently growing and get personalized AI-powered daily actions based on real weather data.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm font-[family-name:var(--font-body)]"
                >+ Add Crop</button>
              </div>
            ) : loadingPlan ? (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">Generating your farm plan...</p>
                <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] mt-1">Analyzing {growingCrops.length} crops against real weather data</p>
              </div>
            ) : plan ? (
              <div className="space-y-6">
                {/* Week Outlook */}
                {plan.weekOutlook && (
                  <div className="bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] rounded-2xl p-6 text-white">
                    <h3 className="font-bold font-[family-name:var(--font-display)] mb-2 flex items-center gap-2">
                      🌤️ Week Outlook — {plan.location}
                    </h3>
                    <p className="text-sm text-white/90 font-[family-name:var(--font-body)] leading-relaxed">{plan.weekOutlook}</p>

                    {/* 7-Day Forecast Cards */}
                    {plan.forecast && plan.forecast.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 mt-4">
                        {plan.forecast.map((day, i) => (
                          <div key={i} className="bg-white/10 rounded-xl p-3 text-center border border-white/20 flex-shrink-0 w-24 sm:w-28">
                            <p className="text-xs font-semibold text-white font-[family-name:var(--font-body)]">{day.date}</p>
                            <p className="text-lg sm:text-xl my-1">{day.condition === "Sunny" ? "☀️" : day.condition === "Heavy Rain" ? "🌧️" : day.condition === "Light Rain" || day.condition === "Showers" ? "🌦️" : day.condition === "Thunderstorm" ? "⛈️" : day.condition === "Drizzle" ? "🌧️" : "☁️"}</p>
                            <p className="text-[9px] sm:text-[10px] text-white/70 font-[family-name:var(--font-body)]">{day.condition}</p>
                            <p className="text-xs sm:text-sm font-bold text-white font-[family-name:var(--font-body)] mt-1">{day.tempHigh}° / {day.tempLow}°</p>
                            <p className="text-[9px] sm:text-[10px] text-blue-300 font-[family-name:var(--font-body)]">{day.rainfall}mm rain</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-white/50 mt-3 font-[family-name:var(--font-body)]">Generated {fmtDate(plan.generatedAt)} {new Date(plan.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                )}

                {/* Risk Alerts */}
                {plan.riskAlerts && plan.riskAlerts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">⚠️ Risk Alerts</h3>
                    <div className="space-y-2">
                      {plan.riskAlerts.map((alert, i) => (
                        <div key={i} className={`rounded-xl p-4 border ${SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info}`}>
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{alert.severity === "critical" ? "🔴" : alert.severity === "warning" ? "🟠" : "🔵"}</span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold font-[family-name:var(--font-body)]">{alert.risk}</p>
                              <p className="text-xs mt-1 font-[family-name:var(--font-body)] opacity-80">Crop: {alert.crop} • {alert.trigger}</p>
                              <p className="text-xs mt-1 font-[family-name:var(--font-body)] font-medium">→ {alert.action}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily Actions */}
                {plan.dailyActions && plan.dailyActions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">📋 Today&apos;s Actions</h3>
                    <div className="space-y-2">
                      {plan.dailyActions.map((action, i) => {
                        const isDone = doneActions.has(i);
                        return (
                        <div key={i} className={`rounded-xl p-4 border transition-all cursor-pointer select-none ${isDone ? "bg-green-50 border-green-300" : (PRIORITY_STYLES[action.priority] || PRIORITY_STYLES.routine)}`}
                          onClick={() => setDoneActions(prev => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i); else next.add(i);
                            return next;
                          })}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all ${isDone ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-300 hover:border-amber-400 text-gray-500"}`}
                            >
                              {isDone ? "✓" : ""}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] uppercase font-bold font-[family-name:var(--font-body)] opacity-60">{isDone ? "done" : action.priority}</span>
                                <span className="text-[10px] font-[family-name:var(--font-body)] opacity-60">•</span>
                                <span className="text-[10px] font-[family-name:var(--font-body)] opacity-60">{action.crop}</span>
                              </div>
                              <p className={`text-sm font-semibold font-[family-name:var(--font-body)] mt-0.5 ${isDone ? "line-through text-green-700" : ""}`}>{action.action}</p>
                              <p className={`text-xs mt-1 font-[family-name:var(--font-body)] ${isDone ? "text-green-600" : "opacity-70"}`}>{action.reason}</p>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Crop Status Cards */}
                {plan.cropStatus && plan.cropStatus.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-3">🌾 Crop Growth Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.cropStatus.map((cs, i) => {
                        const healthColor = cs.healthScore >= 80 ? "text-green-600" : cs.healthScore >= 60 ? "text-amber-600" : "text-red-600";
                        const harvestDate = parseDMY(cs.estimatedHarvestDate);
                        const daysToHarvest = harvestDate ? Math.max(0, Math.ceil((harvestDate - new Date()) / (1000 * 60 * 60 * 24))) : null;
                        const matchedCrop = growingCrops.find(c => c.cropName.toLowerCase() === cs.cropName.toLowerCase()) || growingCrops[i];
                        return (
                          <div key={i} className="bg-white rounded-xl border border-[#e5e7eb] p-5">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <CropStageImage cropName={cs.cropName} growthStage={cs.growthStage} />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
                                      {cs.cropName}{cs.variety && cs.variety.toLowerCase() !== "unknown" ? ` (${cs.variety})` : ""}
                                    </h4>
                                    {matchedCrop && matchedCrop.id === oldestGrowingCropId && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-[family-name:var(--font-body)] font-semibold border border-blue-200">Free</span>}
                                  </div>
                                  <p className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">Day {cs.daysSincePlanting}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-xl font-bold font-[family-name:var(--font-display)] ${healthColor}`}>
                                  {cs.healthScore}%
                                </div>
                                <p className="text-[9px] text-[#6b7c6b] font-[family-name:var(--font-body)]">Health Score</p>
                              </div>
                            </div>

                            {/* Growth stage bar */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)] mb-1">
                                <span className="font-semibold text-amber-700">{cs.growthStage}</span>
                                <span>→ {cs.nextStage} ({cs.daysToNextStage}d)</span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, (cs.daysSincePlanting / (cs.daysSincePlanting + (daysToHarvest || 30))) * 100)}%` }} />
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-body)]">
                                <span>💧</span>
                                <span className="text-[#6b7c6b]">Water: <span className="font-medium text-[#1a2e1a]">{cs.waterNeed}</span></span>
                              </div>
                              {cs.waterAdvice && (
                                <p className="text-[11px] text-blue-700 bg-blue-50 rounded-lg px-3 py-1.5 font-[family-name:var(--font-body)]">💡 {cs.waterAdvice}</p>
                              )}
                              {daysToHarvest != null && (
                                <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-body)]">
                                  <span>📅</span>
                                  <span className="text-[#6b7c6b]">Est. harvest: <span className="font-medium text-[#1a2e1a]">{daysToHarvest} days</span> ({displayDMY(cs.estimatedHarvestDate)})</span>
                                </div>
                              )}
                              {cs.healthReason && (
                                <p className="text-[11px] text-[#6b7c6b] font-[family-name:var(--font-body)] italic">{cs.healthReason}</p>
                              )}
                              {cs.healthNotes && (
                                <p className="text-[11px] text-[#6b7c6b] font-[family-name:var(--font-body)]">{cs.healthNotes}</p>
                              )}
                              {matchedCrop?.expectedYieldLow > 0 && (
                                <div className="mt-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                                  <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-body)]">
                                    <span>📦</span>
                                    <span className="text-amber-800 font-semibold">Expected Yield: {matchedCrop.expectedYieldLow?.toLocaleString()} — {matchedCrop.expectedYieldHigh?.toLocaleString()} kg</span>
                                  </div>
                                  {matchedCrop.yieldBasis && (
                                    <p className="text-[10px] text-amber-600 mt-0.5 font-[family-name:var(--font-body)]">{matchedCrop.yieldBasis}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Refresh Button */}
                <div className="text-center">
                  <button
                    onClick={generatePlan}
                    disabled={loadingPlan}
                    className="text-sm text-amber-600 hover:text-amber-700 font-semibold font-[family-name:var(--font-body)] disabled:opacity-50"
                  >
                    🔄 Refresh Plan with Latest Weather
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 text-center">
                <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-4">Could not generate plan. Click below to try again.</p>
                <button onClick={generatePlan} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm font-[family-name:var(--font-body)]">
                  Generate Farm Plan
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: My Crops ─── */}
        {activeTab === "crops" && (
          <div>
            {growingCrops.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center">
                <span className="text-5xl mb-4 block">🌾</span>
                <h3 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">No crops yet</h3>
                <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-4">Add your current crops to start tracking them.</p>
                <button onClick={() => setShowAddForm(true)} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm font-[family-name:var(--font-body)]">+ Add Crop</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {growingCrops.map((crop, cropIdx) => {
                  const cs = plan?.cropStatus?.find(s => s.cropName.toLowerCase() === crop.cropName.toLowerCase());
                  return (
                  <div key={crop.id} className="bg-white rounded-xl border border-[#e5e7eb] p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex gap-3 flex-1 min-w-0">
                        <CropStageImage cropName={crop.cropName} growthStage={cs?.growthStage} size="sm" />
                        <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{crop.cropName}</h3>
                          {crop.variety && <span className="text-[10px] bg-gray-100 text-[#6b7c6b] px-2 py-0.5 rounded-full font-[family-name:var(--font-body)]">{crop.variety}</span>}
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-[family-name:var(--font-body)] font-semibold">Growing</span>
                          {crop.id === oldestGrowingCropId && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-[family-name:var(--font-body)] font-semibold border border-blue-200">Free</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">
                          <span>📍 {crop.location}</span>
                          <span>📅 Planted {fmtDate(crop.plantingDate)} ({daysSince(crop.plantingDate)}d ago)</span>
                          {crop.area > 0 && <span>📐 {crop.area} {crop.areaUnit}</span>}
                          {crop.seedQuantity > 0 && <span>🌰 {crop.seedQuantity} {crop.seedUnit}</span>}
                          {crop.spacing && <span>↔️ {crop.spacing}</span>}
                        </div>
                        {(() => {
                          const cs = plan?.cropStatus?.find(s => s.cropName.toLowerCase() === crop.cropName.toLowerCase());
                          if (!cs?.estimatedHarvestDate) return null;
                          const hd = parseDMY(cs.estimatedHarvestDate);
                          if (!hd) return null;
                          const daysLeft = Math.max(0, Math.ceil((hd - new Date()) / (1000 * 60 * 60 * 24)));
                          return (
                            <div className="mt-2 flex items-center gap-2 text-xs font-[family-name:var(--font-body)]">
                              <span className="text-green-700 font-semibold">🗓️ Est. harvest: {displayDMY(cs.estimatedHarvestDate)}</span>
                              <span className="text-[#6b7c6b]">({daysLeft} days left)</span>
                            </div>
                          );
                        })()}
                        {crop.notes && <p className="text-xs text-[#6b7c6b] mt-2 font-[family-name:var(--font-body)] italic">{crop.notes}</p>}
                        {crop.expectedYieldLow > 0 && (
                          <div className="mt-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100 inline-block">
                            <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-body)]">
                              <span>📦</span>
                              <span className="text-amber-800 font-semibold">Expected: {crop.expectedYieldLow?.toLocaleString()} — {crop.expectedYieldHigh?.toLocaleString()} kg</span>
                            </div>
                            {crop.yieldBasis && (
                              <p className="text-[10px] text-amber-600 mt-0.5 font-[family-name:var(--font-body)]">{crop.yieldBasis}</p>
                            )}
                          </div>
                        )}
                      </div>  {/* end flex-1 text content */}
                      </div>  {/* end flex gap-3 wrapper */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 sm:ml-4 w-full sm:w-auto sm:flex-col">
                        <button
                          onClick={() => { setHarvestModal(crop); setHarvestForm({ harvestDate: new Date().toISOString().split("T")[0], harvestYield: "", yieldUnit: "kg" }); }}
                          className="text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg font-[family-name:var(--font-body)] font-medium transition-colors flex-1 sm:flex-none text-center"
                        >✓ Harvested</button>
                        <button
                          onClick={() => updateCropStatus(crop.id, "failed")}
                          className="text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-[family-name:var(--font-body)] font-medium transition-colors flex-1 sm:flex-none text-center"
                        >✗ Failed</button>
                        <button
                          onClick={() => { if (confirm("Remove this crop?")) deleteCrop(crop.id); }}
                          className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1.5 text-[#6b7c6b] hover:text-red-600 transition-colors"
                        >🗑️</button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: Harvest Log ─── */}
        {activeTab === "harvest" && (
          <div>
            {harvestedCrops.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e5e7eb] p-12 text-center">
                <span className="text-5xl mb-4 block">📦</span>
                <h3 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">No harvests yet</h3>
                <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">When you mark crops as harvested, they&apos;ll appear here with market price intelligence.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {harvestedCrops.map(crop => {
                  const duration = crop.harvestDate && crop.plantingDate
                    ? Math.floor((new Date(crop.harvestDate) - new Date(crop.plantingDate)) / (1000 * 60 * 60 * 24))
                    : null;
                  const md = marketData[crop.id];
                  const yc = yieldChat[crop.id];
                  const actualYield = parseFloat(crop.harvestYield) || 0;
                  const expectedMid = (parseFloat(crop.expectedYieldLow) + parseFloat(crop.expectedYieldHigh)) / 2;
                  const hasExpected = crop.expectedYieldLow > 0 && crop.expectedYieldHigh > 0;
                  const yieldPct = hasExpected && actualYield > 0 ? Math.round((actualYield / expectedMid) * 100) : null;
                  const isLowYield = yieldPct != null && yieldPct < 70;
                  return (
                    <div key={crop.id} className="bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
                      {/* Crop Header */}
                      <div className="p-4 sm:p-5 border-b border-[#e5e7eb]">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{crop.cropName}</h3>
                              {crop.variety && <span className="text-[10px] bg-gray-100 text-[#6b7c6b] px-2 py-0.5 rounded-full font-[family-name:var(--font-body)]">{crop.variety}</span>}
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-[family-name:var(--font-body)] font-semibold">Harvested ✓</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-[11px] sm:text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">
                              <span>📍 {crop.location}</span>
                              <span>📅 Planted {fmtDate(crop.plantingDate)}</span>
                              <span>🏁 Harvested {fmtDate(crop.harvestDate)}</span>
                              {duration != null && <span>⏱️ {duration}d</span>}
                              {crop.area > 0 && <span>📐 {crop.area} {crop.areaUnit}</span>}
                              {crop.seedQuantity > 0 && <span>🌱 {crop.seedQuantity} {crop.seedUnit}</span>}
                            </div>
                            {/* Actual vs Expected Yield */}
                            {actualYield > 0 && (
                              <div className="mt-3 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                                <div className="bg-green-50 rounded-lg px-3 py-2 border border-green-200 inline-flex items-center gap-2">
                                  <span className="text-xs font-[family-name:var(--font-body)]">📦 Actual: <span className="font-bold text-green-800">{actualYield.toLocaleString()} {crop.yieldUnit || "kg"}</span></span>
                                </div>
                                {hasExpected && (
                                  <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-200 inline-flex items-center gap-2">
                                    <span className="text-xs font-[family-name:var(--font-body)]">🎯 Expected: <span className="font-semibold text-amber-800">{crop.expectedYieldLow?.toLocaleString()}–{crop.expectedYieldHigh?.toLocaleString()} kg</span></span>
                                  </div>
                                )}
                                {yieldPct != null && (
                                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold font-[family-name:var(--font-body)] ${yieldPct >= 90 ? "bg-green-100 text-green-700" : yieldPct >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                                    {yieldPct >= 100 ? "↑" : "↓"} {yieldPct}% of expected
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Low yield warning + chat */}
                            {isLowYield && (
                              <div className="mt-2">
                                <button
                                  onClick={() => startYieldChat(crop)}
                                  className="text-[10px] sm:text-[11px] px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-[family-name:var(--font-body)] font-semibold transition-colors w-full sm:w-auto text-left sm:text-center"
                                >{yc?.open ? "▼ Hide advice" : "⚠️ Get AI yield advice"}</button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:ml-4">
                            {!md && (
                              <button
                                onClick={() => fetchMarketPrice(crop)}
                                className="text-[10px] sm:text-[11px] px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-[family-name:var(--font-body)] font-semibold transition-colors flex items-center gap-1 flex-1 sm:flex-none justify-center"
                              >💰 Get Market Prices</button>
                            )}
                            <button
                              onClick={() => { if (confirm("Delete this harvest record?")) deleteCrop(crop.id); }}
                              className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1.5 text-[#6b7c6b] hover:text-red-600 transition-colors"
                            >🗑️</button>
                          </div>
                        </div>
                      </div>

                      {/* Yield Chat Area */}
                      {yc?.open && yc?.messages?.length > 0 && (
                        <div className="border-b border-[#e5e7eb]">
                          <div className="bg-red-50/50 p-4 space-y-3 max-h-80 overflow-y-auto">
                            <h4 className="text-xs font-bold text-red-800 font-[family-name:var(--font-body)] flex items-center gap-1.5">🧠 Yield Improvement Chat</h4>
                            {yc.messages.slice(1).map((m, i) => (
                              <div key={i} className={m.role === "assistant" ? "bg-white rounded-xl p-3 border border-red-100" : "bg-red-100 rounded-xl p-3 border border-red-200 ml-8"}>
                                {m.role === "user" && <div className="text-[10px] font-semibold text-red-700 mb-1 font-[family-name:var(--font-body)]">You</div>}
                                <div className="text-[11px] text-[#1a2e1a] font-[family-name:var(--font-body)] leading-relaxed whitespace-pre-wrap">{m.content}</div>
                              </div>
                            ))}
                            {yc.loading && (
                              <div className="flex items-center gap-2 text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">
                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                Analyzing...
                              </div>
                            )}
                          </div>
                          {/* Follow-up input */}
                          <div className="bg-red-50/30 px-4 py-3 border-t border-red-100">
                            <form onSubmit={(e) => { e.preventDefault(); const input = yieldChat[crop.id]?.input || ""; if (input.trim()) sendYieldFollowUp(crop.id, input); }} className="flex gap-2">
                              <input
                                type="text"
                                value={yieldChat[crop.id]?.input || ""}
                                onChange={e => setYieldChat(prev => ({ ...prev, [crop.id]: { ...prev[crop.id], input: e.target.value } }))}
                                placeholder="Ask a follow-up question about this crop..."
                                className="flex-1 px-3 py-2 text-xs border border-red-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none font-[family-name:var(--font-body)] bg-white"
                                disabled={yc.loading}
                              />
                              <button type="submit" disabled={yc.loading || !(yieldChat[crop.id]?.input || "").trim()}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold font-[family-name:var(--font-body)] transition-colors">
                                Ask
                              </button>
                            </form>
                          </div>
                        </div>
                      )}

                      {/* Market Intelligence */}
                      {md?.loading && (
                        <div className="p-6 flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">Fetching market intelligence for {crop.cropName}...</span>
                        </div>
                      )}
                      {md?.error && (
                        <div className="p-4 bg-red-50 text-xs text-red-600 font-[family-name:var(--font-body)] flex items-center justify-between">
                          <span>⚠️ {md.error}</span>
                          <button onClick={() => { setMarketData(prev => { const n = {...prev}; delete n[crop.id]; return n; }); fetchMarketPrice(crop); }} className="text-red-700 font-semibold hover:underline">Retry</button>
                        </div>
                      )}
                      {md?.prices && (
                        <div className="p-5 space-y-5">
                          {/* Price + Strategy Row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Current Price */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                              <h4 className="text-xs font-bold text-green-800 font-[family-name:var(--font-body)] mb-2 flex items-center gap-1.5">💰 Current Market Price</h4>
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-2xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{md.prices.currentPrice?.mid?.toLocaleString()}</span>
                                <span className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{md.prices.currentPrice?.unit}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs font-[family-name:var(--font-body)]">
                                <span className="text-[#6b7c6b]">Range: {md.prices.currentPrice?.low?.toLocaleString()} — {md.prices.currentPrice?.high?.toLocaleString()}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${md.prices.currentPrice?.trend === "rising" ? "bg-green-100 text-green-700" : md.prices.currentPrice?.trend === "falling" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                                  {md.prices.currentPrice?.trend === "rising" ? "↑" : md.prices.currentPrice?.trend === "falling" ? "↓" : "→"} {md.prices.currentPrice?.trend}
                                </span>
                              </div>
                              <p className="text-[11px] text-green-700 mt-1.5 font-[family-name:var(--font-body)]">{md.prices.currentPrice?.trendReason}</p>
                            </div>

                            {/* Sell Strategy */}
                            <div className={`rounded-xl p-4 border ${md.prices.sellStrategy?.recommendation === "sell_now" ? "bg-amber-50 border-amber-200" : md.prices.sellStrategy?.recommendation === "store_and_wait" ? "bg-blue-50 border-blue-200" : "bg-purple-50 border-purple-200"}`}>
                              <h4 className="text-xs font-bold font-[family-name:var(--font-body)] mb-2 flex items-center gap-1.5">
                                {md.prices.sellStrategy?.recommendation === "sell_now" ? "🔥 Sell Now" : md.prices.sellStrategy?.recommendation === "store_and_wait" ? "🏪 Store & Wait" : "⚙️ Process First"}
                              </h4>
                              <p className="text-xs font-[family-name:var(--font-body)] text-[#1a2e1a] leading-relaxed">{md.prices.sellStrategy?.reasoning}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="text-[10px] bg-white/60 rounded-full px-2 py-0.5 font-[family-name:var(--font-body)]">⏰ {md.prices.sellStrategy?.optimalSellWindow}</span>
                                {md.prices.sellStrategy?.estimatedRevenue && (
                                  <span className="text-[10px] bg-white/60 rounded-full px-2 py-0.5 font-semibold font-[family-name:var(--font-body)]">
                                    💵 Est: {md.prices.sellStrategy.estimatedRevenue.low?.toLocaleString()} — {md.prices.sellStrategy.estimatedRevenue.high?.toLocaleString()} {md.prices.sellStrategy.estimatedRevenue.currency}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Best Markets */}
                          {md.prices.bestMarkets?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-2">📍 Best Markets to Sell</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {md.prices.bestMarkets.map((m, idx) => (
                                  <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-body)]">{m.name}</span>
                                      <span className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)]">{m.distance}</span>
                                    </div>
                                    <p className="text-[11px] text-[#6b7c6b] font-[family-name:var(--font-body)]">{m.location} • {m.priceRange}</p>
                                    <p className="text-[10px] text-amber-700 mt-1 font-[family-name:var(--font-body)]">💡 {m.tip}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Value Addition */}
                          {md.prices.valueAddition?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-2">⚡ Value Addition Options</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {md.prices.valueAddition.map((v, idx) => (
                                  <div key={idx} className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-bold text-purple-800 font-[family-name:var(--font-body)]">{v.method}</span>
                                      <span className="text-[10px] bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full font-[family-name:var(--font-body)]">{v.effort}</span>
                                    </div>
                                    <p className="text-xs font-semibold text-green-700 font-[family-name:var(--font-body)]">{v.priceIncrease}</p>
                                    <p className="text-[10px] text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)]">{v.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Seasonal Insight + Buyer Tips */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {md.prices.seasonalInsight && (
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                <h4 className="text-xs font-bold text-blue-800 font-[family-name:var(--font-body)] mb-1">📊 Seasonal Price Pattern</h4>
                                <p className="text-[11px] text-blue-800 font-[family-name:var(--font-body)] leading-relaxed">{md.prices.seasonalInsight}</p>
                              </div>
                            )}
                            {md.prices.buyerTips && (
                              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                <h4 className="text-xs font-bold text-amber-800 font-[family-name:var(--font-body)] mb-1">🤝 Selling Tips</h4>
                                <p className="text-[11px] text-amber-800 font-[family-name:var(--font-body)] leading-relaxed">{md.prices.buyerTips}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Harvest Modal ─── */}
      {harvestModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setHarvestModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-1">🏁 Record Harvest</h3>
            <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-5">{harvestModal.cropName}{harvestModal.variety ? ` (${harvestModal.variety})` : ""} • {harvestModal.location}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1">Harvest Date *</label>
                <input type="date" value={harvestForm.harvestDate} onChange={e => setHarvestForm(f => ({ ...f, harvestDate: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f] outline-none font-[family-name:var(--font-body)]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1">Actual Yield *</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="e.g., 500" value={harvestForm.harvestYield} onChange={e => setHarvestForm(f => ({ ...f, harvestYield: e.target.value }))}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f] outline-none font-[family-name:var(--font-body)]" />
                  <select value={harvestForm.yieldUnit} onChange={e => setHarvestForm(f => ({ ...f, yieldUnit: e.target.value }))}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f] outline-none font-[family-name:var(--font-body)]">
                    <option value="kg">kg</option>
                    <option value="tonnes">tonnes</option>
                    <option value="bags">bags (100kg)</option>
                  </select>
                </div>
                {harvestModal.expectedYieldLow > 0 && (
                  <p className="text-[10px] text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)]">
                    Expected yield was {harvestModal.expectedYieldLow?.toLocaleString()}–{harvestModal.expectedYieldHigh?.toLocaleString()} kg
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setHarvestModal(null)}
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-[#6b7c6b] hover:bg-gray-50 font-[family-name:var(--font-body)] transition-colors">Cancel</button>
              <button onClick={submitHarvest}
                className="flex-1 px-4 py-2.5 text-sm bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-lg font-[family-name:var(--font-body)] font-semibold transition-colors">Save Harvest</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {chatOpen && (
          <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] flex flex-col overflow-hidden" style={{ maxHeight: "70vh" }}>
            <div className="bg-[#1b4332] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧠</span>
                <span className="text-sm font-bold text-white font-[family-name:var(--font-body)]">Farm AI Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowChatList(v => !v)} className="text-white/70 hover:text-white text-sm" title="Chat history">
                  {showChatList ? "💬" : "📋"}
                </button>
                <button onClick={startNewChat} className="text-white/70 hover:text-white text-sm" title="New chat">＋</button>
                <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white text-lg">✕</button>
              </div>
            </div>

            {showChatList ? (
              /* Chat History List */
              <div className="flex-1 overflow-y-auto bg-[#f7faf6]" style={{ minHeight: 200, maxHeight: "50vh" }}>
                <div className="px-4 py-3 border-b border-[#e5e7eb] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1a2e1a] font-[family-name:var(--font-body)]">Previous Chats</span>
                  <button onClick={startNewChat} className="text-[10px] bg-[#2d6a4f] text-white px-2 py-1 rounded-lg font-[family-name:var(--font-body)] hover:bg-[#1b4332]">+ New Chat</button>
                </div>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : chatHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">No previous chats yet.</p>
                    <button onClick={startNewChat} className="mt-2 text-xs text-[#2d6a4f] font-semibold font-[family-name:var(--font-body)]">Start your first chat →</button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e5e7eb]">
                    {chatHistory.map((chat) => (
                      <button key={chat.documentId} onClick={() => loadChat(chat)}
                        className={`w-full text-left px-4 py-3 hover:bg-white transition-colors ${activeChatId === chat.documentId ? "bg-white border-l-2 border-[#2d6a4f]" : ""}`}>
                        <div className="text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)] truncate">{chat.title}</div>
                        <div className="text-[10px] text-[#6b7c6b] font-[family-name:var(--font-body)] mt-0.5">
                          {chat.messages?.length || 0} messages · {chat.lastMessageAt ? fmtDate(chat.lastMessageAt) : ""}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Active Chat */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f7faf6]" style={{ minHeight: 200, maxHeight: "50vh" }}>
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-3xl mb-2">🌱</div>
                      <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Ask me anything about your crops, weather, planting tips, or market prices!</p>
                      {chatHistory.length > 0 && (
                        <button onClick={() => setShowChatList(true)} className="mt-3 text-[10px] text-[#2d6a4f] font-semibold font-[family-name:var(--font-body)] underline">View previous chats ({chatHistory.length})</button>
                      )}
                    </div>
                  )}
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed font-[family-name:var(--font-body)] whitespace-pre-wrap ${m.role === "user" ? "bg-[#2d6a4f] text-white" : "bg-white border border-[#e5e7eb] text-[#1a2e1a]"}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-[#e5e7eb] rounded-xl px-3 py-2 flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={e => { e.preventDefault(); sendChat(); }} className="border-t border-[#e5e7eb] px-3 py-2 flex gap-2 bg-white">
                  <input ref={chatInputRef} type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                    placeholder="Ask about your farm..." disabled={chatLoading}
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f] outline-none font-[family-name:var(--font-body)]" />
                  <button type="submit" disabled={chatLoading || !chatInput.trim()}
                    className="px-3 py-2 bg-[#2d6a4f] hover:bg-[#1b4332] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors">Send</button>
                </form>
              </>
            )}
          </div>
        )}
        <button onClick={() => setChatOpen(o => !o)}
          className="w-14 h-14 rounded-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white shadow-lg flex flex-col items-center justify-center transition-all hover:scale-105">
          <span className="text-xl leading-none">🧠</span>
          <span className="text-[8px] font-bold font-[family-name:var(--font-body)] leading-none mt-0.5">AI</span>
        </button>
      </div>

      {/* Subscription Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.open}
        onClose={() => setPaymentModal({ open: false, context: "crop", cropData: null })}
        onSuccess={async (subData) => {
          // Capture values before state resets
          const ctx = paymentModal.context;
          const pending = pendingCropForm;
          const subDocId = subData?.subscription?.documentId;
          setPaymentModal({ open: false, context: "crop", cropData: null });
          if (ctx === "crop" && pending) {
            // Retry adding the crop after successful payment
            try {
              const token = getToken();
              const res = await fetch("/api/farm-crops", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(pending),
              });
              const data = await res.json();
              if (data.crop) {
                setCrops(prev => [data.crop, ...prev]);
                setCropForm({
                  cropName: "", variety: "", area: "", areaUnit: "acres",
                  plantingDate: new Date().toISOString().split("T")[0],
                  location: pending.location,
                  seedQuantity: "", seedUnit: "kg", spacing: "",
                });
                setShowAddForm(false);
                setActiveTab("plan");
                setPlan(null); // Force regeneration with new crop
                // Link the crop's documentId to the subscription
                if (subDocId && data.crop.documentId) {
                  try {
                    await fetch("/api/subscription", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({
                        subscriptionDocumentId: subDocId,
                        cropDocumentId: data.crop.documentId,
                        cropName: data.crop.cropName,
                      }),
                    });
                  } catch {}
                }
              } else {
                // If still rejected (e.g. Strapi race), force close form anyway
                console.error("Crop add after payment returned:", data);
                setShowAddForm(false);
                alert(data.message || "Crop could not be added. Please try adding it again manually.");
              }
            } catch (err) {
              console.error("Failed to add crop after payment:", err);
              setShowAddForm(false);
              alert("Something went wrong adding your crop. Please try adding it again from My Crops tab.");
            }
            setPendingCropForm(null);
          }
        }}
        context={paymentModal.context}
        cropData={paymentModal.cropData}
        getToken={getToken}
      />
    </div>
  );
}
