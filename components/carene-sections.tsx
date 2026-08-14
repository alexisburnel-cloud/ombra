/* Sections CARÈNE — contenus et photos vérifiés (carene.net) */

const REALISATIONS = [
  { src: "/photos/real-1.jpg", cat: "Maison", label: "Pierre, enduit & bois" },
  { src: "/photos/maison-terrasse-couverte.jpg", cat: "Villa", label: "Terrasse couverte" },
  { src: "/photos/renovation-ferme.jpg", cat: "Rénovation", label: "Bâti ancien transformé" },
  { src: "/photos/maison-galets.jpg", cat: "Maison", label: "Galets & œil-de-bœuf" },
  { src: "/photos/maison-piscine-soir.jpg", cat: "Villa", label: "Piscine & pergola" },
  { src: "/photos/maison-monopente.jpg", cat: "Maison", label: "Plain-pied monopente" },
];

const DECENNIES = [
  { src: "/photos/archive-1980.jpg", annee: "1980", label: "L'authenticité des premiers jours" },
  { src: "/photos/archive-1990.jpg", annee: "1990", label: "La maison familiale s'affirme" },
  { src: "/photos/maison-2000.jpg", annee: "2000", label: "Des lignes plus contemporaines" },
  { src: "/photos/maison-2010.jpg", annee: "2010", label: "Des agencements ouverts et fonctionnels" },
  { src: "/photos/maison-2020.jpg", annee: "2020", label: "Matériaux performants et responsables" },
];

/* eslint-disable @next/next/no-img-element */
export function CareneSections() {
  return (
    <>
      <section id="realisations" className="bg-neutral-950 px-6 py-16 text-white md:px-16 md:py-28">
        <p className="mb-4 text-xs uppercase tracking-[0.45em] text-[#5adfa5]">
          45 réalisations — maisons, villas, extensions
        </p>
        <h2 className="max-w-3xl text-4xl font-semibold leading-[0.95] tracking-[-0.05em] md:text-7xl">
          Des maisons qui vous ressemblent.
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REALISATIONS.map((r) => (
            <figure key={r.src} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <img
                src={r.src}
                alt={`${r.cat} — ${r.label}`}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.04]"
              />
              <figcaption className="flex items-baseline justify-between px-4 py-3">
                <span className="text-[11px] uppercase tracking-[0.3em] text-[#5adfa5]">{r.cat}</span>
                <span className="text-xs uppercase tracking-[0.14em] text-white/60">{r.label}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="heritage" className="bg-[#0d1210] px-6 py-16 text-white md:px-16 md:py-28">
        <p className="mb-4 text-xs uppercase tracking-[0.45em] text-[#5adfa5]">Savoir évoluer avec le temps</p>
        <h2 className="max-w-3xl text-4xl font-semibold leading-[0.95] tracking-[-0.05em] md:text-7xl">
          Quatre décennies, une exigence.
        </h2>
        <div className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-5">
          {DECENNIES.map((d) => (
            <figure key={d.annee}>
              <img
                src={d.src}
                alt={`Réalisation Carène des années ${d.annee}`}
                loading="lazy"
                className="aspect-[3/4] w-full rounded-xl object-cover"
              />
              <figcaption className="mt-3">
                <span className="block text-sm font-semibold text-[#5adfa5]">{d.annee}</span>
                <span className="mt-1 block text-xs leading-5 text-white/55">{d.label}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-14 max-w-2xl text-lg leading-8 text-white/70 md:text-xl">
          L&apos;expérience se transmet, les valeurs demeurent, l&apos;ambition progresse.
        </p>
      </section>

      <section id="equipe" className="bg-neutral-950 px-6 py-16 text-white md:px-16 md:py-28">
        <p className="mb-4 text-xs uppercase tracking-[0.45em] text-[#5adfa5]">Une vision commune</p>
        <h2 className="max-w-3xl text-4xl font-semibold leading-[0.95] tracking-[-0.05em] md:text-7xl">
          Faire vivre l&apos;ADN de Carène.
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-16">
          <div className="grid grid-cols-2 gap-5">
            <figure>
              <img
                src="/photos/equipe-timothee-rousset.jpg"
                alt="Timothée Rousset, dirigeant de Carène"
                loading="lazy"
                className="aspect-[3/4] w-full rounded-xl object-cover"
              />
              <figcaption className="mt-3">
                <span className="block text-base font-semibold">Timothée Rousset</span>
                <span className="mt-1 block text-xs leading-5 text-white/55">
                  Dirigeant — relation projet & suivi de chantiers
                </span>
              </figcaption>
            </figure>
            <figure>
              <img
                src="/photos/equipe-jean-marc-munia.jpg"
                alt="Jean Marc Munia, relation client chez Carène"
                loading="lazy"
                className="aspect-[3/4] w-full rounded-xl object-cover"
              />
              <figcaption className="mt-3">
                <span className="block text-base font-semibold">Jean Marc Munia</span>
                <span className="mt-1 block text-xs leading-5 text-white/55">Relation client</span>
              </figcaption>
            </figure>
          </div>
          <div className="grid grid-cols-2 gap-6 md:flex md:flex-col md:justify-center md:gap-10">
            <div>
              <span className="block text-6xl font-semibold tracking-[-0.05em] text-[#40c98f] md:text-8xl">1979</span>
              <span className="mt-2 block text-xs uppercase tracking-[0.3em] text-white/55">Année de création</span>
            </div>
            <div>
              <span className="block text-6xl font-semibold tracking-[-0.05em] text-[#40c98f] md:text-8xl">45</span>
              <span className="mt-2 block text-xs uppercase tracking-[0.3em] text-white/55">
                Réalisations — maisons, villas, extensions
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
