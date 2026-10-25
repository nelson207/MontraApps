import ImpersonationBanner from "@platform/features/workContext/components/ImpersonationBanner";
import WorkContextMenu from "@platform/features/workContext/components/WorkContextMenu";

// Montra Factoring's slots in the shared layout (see platform/app/contract.ts): the shared working
// context — its menu in the top bar and, while acting on someone's behalf, the banner.

/** Top bar, between the notifications and the user menu */
export const TopbarExtras = WorkContextMenu;

/** Above every page */
export const LayoutBanner = ImpersonationBanner;
