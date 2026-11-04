import WarningStory from "./home/WarningStory";

export default function Solution() {
  return (
    <section id="solution" className="py-16 sm:py-24 bg-gradient-to-b from-[#eef6f0] to-[#f6faf7]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#2d6a4f]">Our solution</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-[#1a2e1a] max-w-3xl mx-auto">From a forecast to a phone in the village</h2>
        </div>
        <p className="mt-3 text-[#4a5c4a] max-w-2xl mx-auto text-center font-[family-name:var(--font-body)]">
          Every day KibiraAI checks the past 30 days, today and the coming week for each district, against what is usual there, and drafts warnings people can act on.
        </p>
        <div className="mt-10">
          <WarningStory />
        </div>
      </div>
    </section>
  );
}
