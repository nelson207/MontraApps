// Montra Factoring's slots in the shared layout (see platform/app/contract.ts): none. The login
// user's entity decides what the factoring API shows, so a working context (or acting on someone's
// behalf) would change nothing here and only suggest it does.

function Nothing() {
  return null;
}

/** Top bar, between the notifications and the user menu */
export const TopbarExtras = Nothing;

/** Above every page */
export const LayoutBanner = Nothing;
