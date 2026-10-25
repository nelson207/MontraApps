// Montra Customer's slots in the shared layout (see platform/app/contract.ts): none. A customer has
// no working context (no network to act on behalf of), so neither its menu nor its banner.

function Nothing() {
  return null;
}

/** Top bar, between the notifications and the user menu */
export const TopbarExtras = Nothing;

/** Above every page */
export const LayoutBanner = Nothing;
