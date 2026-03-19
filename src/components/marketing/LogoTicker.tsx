import Image from "next/image"

// Per-logo size overrides — text-only logos need more width/height to read
const LOGO_SIZES: Record<string, { w: number; h: number }> = {
  "/partners/6fSaG0Z9T6wu55AmxL45rMrgNms.avif": { w: 120, h: 40 }, // Toll Brothers — text heavy
  "/partners/eZBM2bc6w6VUFPmhsr8gPaOjIM.avif":  { w: 120, h: 44 }, // Coca-Cola — script
  "/partners/L6nZm8LsScxRkCrVutLpBDCd8w.avif":  { w: 120, h: 42 }, // American Campus — icon+text
  "/partners/fTtyMgNdt6LbHbeiKlQuYCtl6I.avif":  { w: 110, h: 36 }, // Fairfield — text only
  "/partners/YtZJ5gkoFtLfH4Xc9WYswHbSUTg.avif": { w: 110, h: 42 }, // Cortland — icon+text
  "/partners/QwquX6NUmGF7dXFs9HDwVQXWIwA.avif": { w: 110, h: 36 }, // large text logo
  "/partners/u7OFAO2pJctDed0w5dB7QQyFELE.avif":  { w: 110, h: 36 }, // large text logo
}

const DEFAULT_SIZE = { w: 100, h: 36 }

const PARTNER_LOGOS = [
  { name: "UDR", src: "/partners/2MAkhjCzE5rmoivR73vacCpvYE.avif" },
  { name: "Toll Brothers", src: "/partners/6fSaG0Z9T6wu55AmxL45rMrgNms.avif" },
  { name: "Coca-Cola", src: "/partners/eZBM2bc6w6VUFPmhsr8gPaOjIM.avif" },
  { name: "American Campus Communities", src: "/partners/L6nZm8LsScxRkCrVutLpBDCd8w.avif" },
  { name: "Fairfield", src: "/partners/fTtyMgNdt6LbHbeiKlQuYCtl6I.avif" },
  { name: "Cortland", src: "/partners/YtZJ5gkoFtLfH4Xc9WYswHbSUTg.avif" },
  { name: "Partner 7", src: "/partners/G2WVMPYZVTalJh2TsngSqDZZQ6I.png" },
  { name: "Partner 8", src: "/partners/HCqhT2AiwBd4f3PPTQvkN060To.avif" },
  { name: "Partner 9", src: "/partners/ac2RHlulREX59beW2DyOT9M.avif" },
  { name: "Partner 10", src: "/partners/mVdzJCbBegj8kgjaaFvX9dmQ.avif" },
  { name: "Partner 11", src: "/partners/qwJc87QEVGXRmujMn6BYKosw.avif" },
  { name: "Partner 12", src: "/partners/QwquX6NUmGF7dXFs9HDwVQXWIwA.avif" },
  { name: "Partner 13", src: "/partners/u7OFAO2pJctDed0w5dB7QQyFELE.avif" },
  { name: "Partner 14", src: "/partners/BCjmjvO3kaIcfATekJuchMQVek.avif" },
]

export function LogoTicker() {
  // Triple the logos so the loop is always full and seamless at any viewport
  const track = [...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS]

  return (
    <section className="border-y border-border bg-ink py-10">
      <div className="mx-auto max-w-6xl px-4">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Our team has operated inside
        </p>
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#08090D] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#08090D] to-transparent" />

          {/* Ticker track — animates translateX(0) → translateX(-33.333%) seamlessly */}
          <div className="flex will-change-transform animate-ticker-seamless items-center">
            {track.map((logo, i) => {
              const size = LOGO_SIZES[logo.src] ?? DEFAULT_SIZE
              return (
                <div
                  key={i}
                  className="mx-6 sm:mx-12 inline-flex flex-shrink-0 items-center justify-center brightness-0 invert opacity-40 hover:opacity-70 transition-opacity scale-[0.65] sm:scale-100"
                  style={{ width: size.w, height: size.h }}
                >
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    width={size.w}
                    height={size.h}
                    className="object-contain w-full h-full"
                    sizes={`${size.w}px`}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
