import { useEffect, useState } from "react";
import {
  applyDomTheme,
  getStoredTheme,
  persistTheme,
  type ThemeMode,
} from "./theme";

const tocNav = [
  { label: "Gallery", href: "#gallery" },
  { label: "Carousel", href: "#carousel" },
  { label: "Accents", href: "#accents", active: true },
  { label: "Editorial", href: "#editorial" },
  { label: "Collections", href: "#collections" },
  { label: "Credits", href: "#credits" },
];

const tags = ["Fashion", "Art", "Travel", "Photography"];

/** Fixed-size picsum URLs (stable IDs) so assets resolve consistently in dev/offline builds */
function picsum(id: number, w: number, h: number) {
  return `https://picsum.photos/id/${id}/${w}/${h}`;
}

/** Direct Unsplash CDN (`images.unsplash.com/photo-…`). `source.unsplash.com` is deprecated and often 404s. */
function unsplashCrop(photoId: string, w: number, h: number) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

const galleryImages = [
  {
    src: unsplashCrop("photo-1502602898657-3e91760cbb34", 800, 600),
    alt: "Eiffel Tower in Paris",
  },
  {
    src: unsplashCrop("photo-1515542622106-78bda8ba0e5b", 800, 600),
    alt: "The Colosseum in Rome",
  },
  {
    src: unsplashCrop("photo-1545569341-9eb8b30979d9", 800, 600),
    alt: "Pagoda and pond in Japan",
  },
  {
    src: unsplashCrop("photo-1476610182048-b716b8518aae", 800, 600),
    alt: "Church and shore in Iceland",
  },
];

function IconThemeAuto() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 16v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconThemeLight() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.31 11.31 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.31-11.31 1.41-1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconThemeDark() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3 6.5 6.5 0 1 0 21 14.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const themeIconControls = [
  { mode: "system" as const, label: "Match system theme", Icon: IconThemeAuto },
  { mode: "light" as const, label: "Light theme", Icon: IconThemeLight },
  { mode: "dark" as const, label: "Dark theme", Icon: IconThemeDark },
];

/** Horizontal strip; picsum IDs stay fixed. 4:3 tiles use object-fit: cover in CSS. */
const stripFrames = [
  {
    src: picsum(1043, 900, 675),
    caption: "Venice, worn varnish.",
  },
  {
    src: picsum(1047, 900, 675),
    caption: "Wool, hard sidelight.",
  },
  {
    src: picsum(1050, 900, 675),
    caption: "Frost on the ridge, through glass.",
  },
  {
    src: picsum(1052, 900, 675),
    caption: "Linen at dusk.",
  },
];

export function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    applyDomTheme(themeMode);
    persistTheme(themeMode);
  }, [themeMode]);

  return (
    <div className="playground-root">
      <div className="layout-grid">
        <aside className="sidebar">
          <nav className="sidebar-nav" aria-label="Table of contents">
            {tocNav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`sidebar-link ${item.active ? "sidebar-link-active" : ""}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="sidebar-tools">
            <div className="theme-switch" role="group" aria-label="Theme">
              {themeIconControls.map(({ mode, label, Icon }) => (
                <button
                  key={mode}
                  type="button"
                  className={`theme-icon-btn ${themeMode === mode ? "theme-icon-btn-active" : ""}`}
                  aria-label={label}
                  aria-pressed={themeMode === mode}
                  title={label}
                  onClick={() => setThemeMode(mode)}
                >
                  <Icon />
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="main-column">
          <div className="main-shell">
            <header className="article-hero">
              <h1 className="display-title">Meridian</h1>
              <p className="lead">
                A small layout sandbox with photos, type, and things on the page you can grab and
                rearrange. Hit <kbd className="kbd">⌘⇧E</kbd> when you want in.
              </p>
            </header>

            <section id="gallery" className="section demo-section">
              <div className="section-head">
                <h2 className="section-title">Gallery</h2>
                <p className="section-body">
                  Shuffle the tags below. In Weevar&apos;s pointer mode, dragging shows an{" "}
                  <code className="inline-code">order</code> preview so you can see where things land.
                </p>
              </div>
              <div className="pill-row">
                {tags.map((tag) => (
                  <button key={tag} type="button" className="pill">
                    {tag}
                  </button>
                ))}
              </div>
              <div className="section-widget gallery-widget">
                <div className="gallery-grid">
                  {galleryImages.map((image, index) => (
                    <figure key={image.src} className="gallery-cell">
                      {index === 3 ? (
                        <img src={stripFrames[0]!.src} alt="" loading="lazy" draggable={false} />
                      ) : (
                        <img src={image.src} alt={image.alt} loading="lazy" />
                      )}
                    </figure>
                  ))}
                </div>
              </div>
            </section>

            <section id="carousel" className="section demo-section">
              <div className="section-head">
                <h2 className="section-title">Carousel</h2>
                <p className="section-body">
                  Scroll sideways through one row. Each tile is locked to 4:3 and uses{" "}
                  <code className="inline-code">object-fit: cover</code>, so weird ratios don&apos;t
                  blow up the layout or leave broken thumbnails.
                </p>
              </div>
              <div className="section-widget carousel-widget">
                <div className="carousel-scroll" tabIndex={0}>
                  {stripFrames.map((frame, index) => (
                    <figure key={frame.src} className="carousel-slide">
                      <div className="carousel-slide-frame">
                        {index === 0 ? (
                          <img src={galleryImages[3]!.src} alt={galleryImages[3]!.alt} loading="lazy" />
                        ) : (
                          <img src={frame.src} alt="" loading="lazy" draggable={false} />
                        )}
                      </div>
                      <figcaption className="carousel-slide-caption">{frame.caption}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </section>

            <section id="accents" className="section demo-section">
              <div className="section-head">
                <h2 className="section-title">Accents</h2>
                <p className="section-body">
                  Three pretend postage stamps: a little drawing from somewhere, then the city and
                  country underneath. No cancellation marks, just the illustration.
                </p>
              </div>
              <div className="section-widget stamps-widget">
                <div className="stamp-row">
                  <article className="stamp-card stamp-card--tilt-ccw">
                    <div className="stamp-mount">
                    <div className="city-stamp city-stamp--green">
                      <div className="stamp-illo" role="img" aria-label="Vintage Lisbon tram">
                        <svg viewBox="0 0 132 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            fill="currentColor"
                            opacity=".88"
                            d="M30 32h72c5 0 9 4 10 9l3 12c1 5-3 9-8 9H30c-4 0-7-3-7-7v-11c0-4 3-7 7-7z"
                          />
                          <path
                            fill="currentColor"
                            opacity=".72"
                            d="M30 30 Q66 18 102 30 V34H30V30z"
                          />
                          <rect x="36" y="40" width="16" height="12" rx="1.5" fill="#c8f5c0" opacity=".95" />
                          <rect x="58" y="40" width="16" height="12" rx="1.5" fill="#c8f5c0" opacity=".95" />
                          <rect x="80" y="40" width="16" height="12" rx="1.5" fill="#c8f5c0" opacity=".95" />
                          <circle cx="42" cy="62" r="7" fill="#e8f5e6" opacity=".9" />
                          <circle cx="42" cy="62" r="3.5" fill="currentColor" opacity=".25" />
                          <circle cx="90" cy="62" r="7" fill="#e8f5e6" opacity=".9" />
                          <circle cx="90" cy="62" r="3.5" fill="currentColor" opacity=".25" />
                          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M52 28h28" opacity=".4" />
                        </svg>
                      </div>
                      <h3 className="stamp-city">Lisbon</h3>
                      <p className="stamp-region">Portugal</p>
                    </div>
                    </div>
                  </article>
                  <article className="stamp-card stamp-card--tilt-cw">
                    <div className="stamp-mount">
                    <div className="city-stamp city-stamp--blue">
                      <div className="stamp-illo" role="img" aria-label="Northern lights over Iceland">
                        <svg viewBox="0 0 140 82" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="stamp-aur-a" x1="0" y1="1" x2="1" y2="0">
                              <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.06" />
                              <stop offset="45%" stopColor="#22d3ee" stopOpacity="0.52" />
                              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.22" />
                            </linearGradient>
                            <linearGradient id="stamp-aur-b" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.1" />
                              <stop offset="55%" stopColor="#7dd3fc" stopOpacity="0.48" />
                              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.16" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M8 58 C38 22 62 68 92 36 S118 52 132 28"
                            stroke="url(#stamp-aur-a)"
                            strokeWidth="10"
                            strokeLinecap="round"
                            fill="none"
                          />
                          <path
                            d="M4 48 C44 18 72 62 104 40 S124 56 136 38"
                            stroke="url(#stamp-aur-b)"
                            strokeWidth="7"
                            strokeLinecap="round"
                            fill="none"
                            opacity=".85"
                          />
                        </svg>
                      </div>
                      <h3 className="stamp-city">Reykjavík</h3>
                      <p className="stamp-region">Iceland</p>
                    </div>
                    </div>
                  </article>
                  <article className="stamp-card stamp-card--tilt-flat">
                    <div className="stamp-mount">
                    <div className="city-stamp city-stamp--rose">
                      <div className="stamp-illo" role="img" aria-label="Torii gate with cherry blossoms">
                        <svg viewBox="0 0 130 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <ellipse cx="28" cy="26" rx="9" ry="5" fill="#fecaca" opacity=".45" transform="rotate(-22 28 26)" />
                          <ellipse cx="102" cy="22" rx="8" ry="4.5" fill="#fcd4d4" opacity=".4" transform="rotate(18 102 22)" />
                          <ellipse cx="82" cy="34" rx="7" ry="4" fill="#fff8f8" opacity=".95" transform="rotate(8 82 34)" />
                          <ellipse cx="46" cy="38" rx="6" ry="3.5" fill="#b91c1c" opacity=".16" transform="rotate(-35 46 38)" />
                          <path stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" d="M38 68 V26 M92 68 V26" />
                          <path
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            fill="none"
                            d="M34 30c21-11 41-11 62 0"
                          />
                          <path stroke="currentColor" strokeWidth="3" d="M28 44h74" opacity=".9" />
                          <path stroke="currentColor" strokeWidth="2" opacity=".35" d="M48 44v20h34V44" />
                        </svg>
                      </div>
                      <h3 className="stamp-city">Kyoto</h3>
                      <p className="stamp-region">Japan</p>
                    </div>
                    </div>
                  </article>
                </div>
              </div>
            </section>

            <section id="editorial" className="section demo-section">
              <div className="section-head">
                <h2 className="section-title">Editorial</h2>
                <p className="section-body">
                  Pull quotes should stay in the background. Pointer mode is handy when you&apos;re
                  nitpicking type on a long block.
                </p>
              </div>
              <div className="section-widget editorial-widget">
                <blockquote className="pull-quote">
                  Light isn&apos;t there to explain the crop. It just shows you where the picture lets
                  you breathe.
                </blockquote>
              </div>
            </section>

            <section id="collections" className="section demo-section">
              <div className="section-head">
                <h2 className="section-title">Collections</h2>
              </div>
              <div className="section-widget collections-widget">
                <div className="card-row">
                  <article className="ui-card">
                    <h3 className="card-heading">Film logs</h3>
                    <p className="card-text">Grain-forward scans from Lisbon and Porto streets.</p>
                    <button type="button" className="ui-btn ui-btn-solid">
                      Open
                    </button>
                  </article>
                  <article className="ui-card">
                    <h3 className="card-heading">Negative space</h3>
                    <p className="card-text">
                      Pages with actual breathing room: fewer dividers, less noise.
                    </p>
                    <button type="button" className="ui-btn ui-btn-outline">
                      Browse
                    </button>
                  </article>
                </div>
              </div>
            </section>

            <section id="credits" className="section demo-section section-footer">
              <div className="section-widget footer-widget">
                <p className="muted">
                  Playground for{" "}
                  <a href="#" className="text-link">
                    Weevar
                  </a>
                  . Select stuff, drag it around, prompt when you need to.
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
