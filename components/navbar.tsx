export function Navbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 px-5 py-5 md:px-10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-black/25 px-5 py-3 text-white shadow-2xl shadow-black/20 backdrop-blur-xl">
        <a href="#top" className="flex items-center gap-2.5 text-sm font-semibold tracking-[0.14em]" aria-label="Accueil CARÈNE">
          <svg width="22" height="22" viewBox="0 0 64 64" aria-hidden="true">
            <path
              d="M10 46 L28 16 L38 30 Q46 38 50 46 L40 46 Q36 34 30 30 L20 46 Z"
              fill="none"
              stroke="#40c98f"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </svg>
          CARÈNE
        </a>
        <div className="hidden items-center gap-8 text-xs uppercase tracking-[0.24em] text-white/55 md:flex">
          <a className="transition hover:text-white" href="#story">La construction</a>
          <a className="transition hover:text-white" href="#reveal">La maison</a>
          <a className="transition hover:text-white" href="#contact">Contact</a>
        </div>
        <a
          href="#contact"
          className="rounded-full bg-[#40c98f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#08110d] transition hover:bg-[#5adfa5]"
        >
          Votre projet
        </a>
      </nav>
    </header>
  );
}
