const LEVEL = {
  warning: { box: "border-red-300 bg-red-50", chip: "bg-red-600 text-white", label: "Warning" },
  watch: { box: "border-orange-300 bg-orange-50", chip: "bg-orange-500 text-white", label: "Be ready" },
  advisory: { box: "border-amber-300 bg-amber-50", chip: "bg-amber-400 text-[#3b2a00]", label: "Advisory" },
};

const until = (iso) =>
  iso ? new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null;

/**
 * Active official warnings from Uganda's Department of Meteorological
 * Services, as issued (their words, their severity), with the districts we
 * serve that they cover.
 */
export default function OfficialAlerts({ alerts, error, compact = false }) {
  return (
    <div className="rounded-2xl border border-[#cfe0d5] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">Official warnings</p>
          <h3 className="text-lg font-bold text-[#1a2e1a]">Uganda Department of Meteorological Services</h3>
        </div>
        <a href="https://wids.mwe.go.ug/early-warning-alerts" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#2d6a4f] hover:underline">
          DMS warnings page →
        </a>
      </div>

      {!alerts?.length ? (
        <p className="mt-3 text-sm text-[#4a5c4a]">
          {error ? "The official warnings could not be checked right now." : "No active official warnings right now."}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {alerts.map((a) => {
            const lv = LEVEL[a.level] || LEVEL.advisory;
            return (
              <div key={a.identifier || a.id} className={`rounded-xl border p-4 ${lv.box}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${lv.chip}`}>{lv.label}</span>
                  <span className="font-bold text-[#1a2e1a]">{a.event}</span>
                  {a.expires && <span className="text-xs text-[#4a5c4a]">until {until(a.expires)}</span>}
                </div>
                <p className="mt-1 text-sm text-[#1a2e1a]">{a.headline}</p>
                {a.districts?.length > 0 && (
                  <p className="mt-1 text-xs text-[#2d6a4f] font-semibold">Covers our districts: {a.districts.join(", ")}</p>
                )}
                {!compact && a.instruction && (
                  <p className="mt-2 text-xs text-[#4a5c4a] whitespace-pre-line line-clamp-4">{a.instruction}</p>
                )}
                {a.web && (
                  <a href={a.web} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs font-semibold text-[#2d6a4f] hover:underline">
                    Full warning →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-[11px] text-[#8a9a8a]">Shown as issued by DMS, Ministry of Water and Environment. KibiraAI&apos;s own warnings are worked out separately.</p>
    </div>
  );
}
