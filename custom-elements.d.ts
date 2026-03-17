import type { DetailedHTMLProps, HTMLAttributes } from "react";

type GeckoBaseProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  locale?: string;
  outlined?: "true" | "false" | boolean;
  "coin-ids"?: string;
  "initial-currency"?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "gecko-coin-price-marquee-widget": GeckoBaseProps & {
        "dark-mode"?: "true" | "false";
        "transparent-background"?: "true" | "false";
      };
      "gecko-coin-compare-chart-widget": GeckoBaseProps;
    }
  }
}
