import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BRAND } from "@app/brand";
import BrandLogo from "@platform/components/brand/BrandLogo";

type Props = {
  children: ReactNode;
};

const YEAR = new Date().getFullYear();

/** Entrance order of a hero line (see app-login-enter) */
const enterStep = (step: number) => ({ "--enter-step": step }) as CSSProperties;

// Login shell: brand panel (desktop) + form side. Everything is text/CSS in the
// theme colors, so it follows Settings → Appearance and other Montra apps reuse it.
function LoginLayout({ children }: Props) {
  const { t } = useTranslation("auth");
  // The app's brand texts: English in brand.ts, other languages in its messages (namespace "app")
  const brand = (key: string, english: string) =>
    t(`app:brand.${key}` as never, { defaultValue: english }) as string;
  return (
    <div className="container-fluid px-0">
      <div className="row g-0 min-vh-100 app-login-shell">
        <aside className="col-lg-7 col-xl-8 d-none d-lg-flex app-login-hero">
          <span className="app-login-watermark" aria-hidden="true">
            {BRAND.mark}
          </span>
          <div className="d-flex flex-column justify-content-between w-100 p-5 position-relative">
            <div className="app-login-hero-content my-auto">
              <div className="app-login-enter" style={enterStep(1)}>
                <BrandLogo size="lg" />
              </div>
              <p
                className="app-login-enter lead mt-3 mb-5 opacity-75"
                style={enterStep(2)}
              >
                {brand("tagline", BRAND.tagline)}
              </p>

              <ul className="list-unstyled d-flex flex-column gap-4 mb-0">
                {BRAND.highlights.map((item, i) => (
                  <li
                    key={item.title}
                    className="app-login-enter d-flex gap-3"
                    style={enterStep(3 + i)}
                  >
                    <span className="app-login-highlight-icon">
                      <i className={`bi ${item.icon}`} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="d-block fw-semibold">
                        {brand(`highlights.${i}.title`, item.title)}
                      </span>
                      <span className="d-block small opacity-75">
                        {brand(`highlights.${i}.text`, item.text)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <small
              className="app-login-enter opacity-75"
              style={enterStep(3 + BRAND.highlights.length)}
            >
              {t("login.family", { family: BRAND.family, year: YEAR })}
            </small>
          </div>
        </aside>

        <main className="col-12 col-lg-5 col-xl-4 d-flex flex-column bg-body app-login-panel">
          <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4 p-sm-5">
            <div className="w-100 auth-form">
              {/* Brand on small screens, where the panel is hidden */}
              <div className="d-flex d-lg-none align-items-center gap-2 mb-5 app-login-mobile-brand">
                <span className="app-brand-mark app-brand-mark-solid">
                  {BRAND.mark}
                </span>
                <BrandLogo size="md" />
              </div>

              {children}
            </div>
          </div>

          <p className="text-center small text-body-secondary py-3 mb-0">
            {t("login.trouble")}
          </p>
        </main>
      </div>
    </div>
  );
}

export default LoginLayout;
