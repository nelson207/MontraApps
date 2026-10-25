import auth from "./locales/en/auth.json";
import common from "./locales/en/common.json";
import errors from "./locales/en/errors.json";
import layout from "./locales/en/layout.json";
import settings from "./locales/en/settings.json";
import workContext from "./locales/en/workContext.json";

// The English texts, bundled (the first paint never waits for them). They're the source of
// truth: the keys of t("…") are typed from them (i18next.d.ts), and every other language must
// have the same keys (locales.test.ts).
export const EN = { common, auth, errors, layout, settings, workContext };

export type Namespace = keyof typeof EN;
export const NAMESPACES = Object.keys(EN) as Namespace[];
