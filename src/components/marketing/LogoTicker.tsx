import Image from "next/image"

const PARTNER_LOGOS = [
  { name: "Partner 1", src: "/partners/2MAkhjCzE5rmoivR73vacCpvYE.avif" },
  { name: "Partner 2", src: "/partners/6fSaG0Z9T6wu55AmxL45rMrgNms.avif" },
  { name: "Partner 3", src: "/partners/ac2RHlulREX59beW2DyOT9M.avif" },
  { name: "Partner 4", src: "/partners/BCjmjvO3kaIcfATekJuchMQVek.avif" },
  { name: "Partner 5", src: "/partners/eZBM2bc6w6VUFPmhsr8gPaOjIM.avif" },
  { name: "Partner 6", src: "/partners/fTtyMgNdt6LbHbeiKlQuYCtl6I.avif" },
  { name: "Partner 7", src: "/partners/G2WVMPYZVTalJh2TsngSqDZZQ6I.png" },
  { name: "Partner 8", src: "/partners/HCqhT2AiwBd4f3PPTQvkN060To.avif" },
  { name: "Partner 9", src: "/partners/L6nZm8LsScxRkCrVutLpBDCd8w.avif" },
  { name: "Partner 10", src: "/partners/mVdzJCbBegj8kgjaaFvX9dmQ.avif" },
  { name: "Partner 11", src: "/partners/qwJc87QEVGXRmujMn6BYKosw.avif" },
  { name: "Partner 12", src: "/partners/QwquX6NUmGF7dXFs9HDwVQXWIwA.avif" },
  { name: "Partner 13", src: "/partners/u7OFAO2pJctDed0w5dB7QQyFELE.avif" },
  { name: "Partner 14", src: "/partners/YtZJ5gkoFtLfH4Xc9WYswHbSUTg.avif" },
]

export function LogoTicker() {
  const doubled = [...PARTNER_LOGOS, ...PARTNER_LOGOS]

  return (
    <section className="border-y border-gray-100 bg-white py-8">
      <div className="mx-auto max-w-6xl px-4">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
          Trusted by sales teams at
        </p>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-white to-transparent" />
          <div className="flex animate-ticker whitespace-nowrap items-center">
            {doubled.map((logo, i) => (
              <div
                key={i}
                className="mx-8 inline-flex items-center justify-center flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
              >
                <div className="relative h-10 w-32">
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    fill
                    className="object-contain"
                    sizes="128px"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
