export function TopHeader() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[var(--chrome-bg)] border-b border-[var(--chrome-border)]">
      <div className="flex justify-between items-center w-full px-6 py-4">
        <span className="font-[family-name:var(--font-title)] text-[17px] font-bold text-[var(--ccbeu-blue)]">
          CCBEU English Center
        </span>
        <div className="w-8 h-8 rounded-full bg-[var(--ccbeu-blue)]/10 text-[var(--ccbeu-blue)] flex items-center justify-center text-[13px] font-semibold">
          C
        </div>
      </div>
    </header>
  );
}
