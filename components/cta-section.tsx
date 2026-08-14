export function CTASection() {
  return (
    <section id="contact" className="grid place-items-center bg-neutral-950 px-6 py-20 text-center text-white md:py-32">
      <div>
        <p className="mb-5 text-xs uppercase tracking-[0.45em] text-[#40c98f]/80">Carène — créateur de lieux de vie</p>
        <h2 className="mx-auto max-w-4xl text-5xl font-semibold tracking-[-0.06em] md:text-8xl">
          Construisons votre lieu de vie.
        </h2>
        <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-white/55 md:text-lg">
          Depuis 1979, Carène conçoit, construit et rénove des maisons sur mesure
          en Drôme, en Ardèche et dans tout le quart sud-est.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="mailto:contact@carene.net?subject=Mon%20projet"
            className="inline-flex rounded-full bg-[#40c98f] px-7 py-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#08110d] transition hover:bg-[#5adfa5]"
          >
            Parler de votre projet
          </a>
          <a
            href="tel:+33673216500"
            className="inline-flex rounded-full border border-white/20 px-7 py-4 text-sm font-medium uppercase tracking-[0.25em] text-white transition hover:border-white hover:bg-white hover:text-black"
          >
            06 73 21 65 00
          </a>
        </div>
        <p className="mt-14 text-xs uppercase tracking-[0.3em] text-white/35">
          Depuis 1979 · Drôme — Ardèche — quart sud-est · carene.net
        </p>
      </div>
    </section>
  );
}
