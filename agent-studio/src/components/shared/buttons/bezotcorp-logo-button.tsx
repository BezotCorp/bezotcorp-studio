import { useTranslation } from "react-i18next";
import BezotCorpLogo from "#/assets/branding/bezotcorp-logo.svg?react";
import { NavigationLink } from "#/components/shared/navigation-link";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

const DEFAULT_LOGO_WIDTH = 46;
const DEFAULT_LOGO_HEIGHT = 30;

export type BezotCorpLogoButtonProps = {
  className?: string;
  /** Applied to the root `<svg>` (e.g. `max-w-none` so Tailwind preflight doesn’t clamp wide marks inside a narrow flex slot). */
  logoClassName?: string;
  logoWidth?: number;
  logoHeight?: number;
};

export function BezotCorpLogoButton({
  className,
  logoClassName,
  logoWidth = DEFAULT_LOGO_WIDTH,
  logoHeight = DEFAULT_LOGO_HEIGHT,
}: BezotCorpLogoButtonProps = {}) {
  const { t } = useTranslation("bezotcorp");

  const ariaLabel = t(I18nKey.BRANDING$BEZOTCORP_LOGO);

  return (
    <NavigationLink
      to="/conversations"
      aria-label={ariaLabel}
      className={cn(className)}
    >
      <BezotCorpLogo
        width={logoWidth}
        height={logoHeight}
        className={cn("shrink-0", logoClassName)}
      />
    </NavigationLink>
  );
}
