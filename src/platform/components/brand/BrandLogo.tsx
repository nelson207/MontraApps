import { APP_NAME, BRAND } from "@app/brand";

type Props = {
  /** lg: login hero · md: login form on mobile · sm: sidebar · xs: small previews */
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

// Montra family lockup: the shared wordmark "MONTRA" + this app's product name.
// Text-based (inherits `color`), so it follows the theme on any background.
function BrandLogo({ size = "sm", className = "" }: Props) {
  return (
    <span className={`app-logo app-logo-${size} ${className}`} role="img" aria-label={APP_NAME}>
      <span className="app-logo-family" aria-hidden="true">
        {BRAND.family}
      </span>
      <span className="app-logo-product" aria-hidden="true">
        {BRAND.product}
      </span>
    </span>
  );
}

export default BrandLogo;
