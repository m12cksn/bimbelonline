export type PlanAccess = {
  label: string;
  questionLimit: number;
  isPremium: boolean;
  priceLabel: string;
  upgradeOptions: Array<{ label: string; priceLabel: string }>;
};

const FALLBACK_FREE_LIMIT = 4;
const PREMIUM_FALLBACK_LIMIT = 30;
const PRICE_FREE = "Gratis";
const PRICE_PREMIUM = "Rp 145rb";
const PRICE_3_BULAN = "Rp 419rb";
const PRICE_ZOOM_PREMIUM = "Rp 1,35jt";

function normalize(value?: string | null) {
  return (value ?? "").toLowerCase();
}

export function resolvePlanAccess(
  planCode?: string | null,
  planName?: string | null,
  isPremiumFlag?: boolean
): PlanAccess {
  const code = normalize(planCode);
  const name = normalize(planName);

  if (code.includes("free") || name.includes("free")) {
    return {
      label: "Free",
      questionLimit: 4,
      isPremium: false,
      priceLabel: PRICE_FREE,
      upgradeOptions: [
        { label: "Premium", priceLabel: PRICE_PREMIUM },
        { label: "3 Bulan", priceLabel: PRICE_3_BULAN },
        { label: "Zoom Premium", priceLabel: PRICE_ZOOM_PREMIUM },
      ],
    };
  }

  if (
    code.includes("3") && name.includes("bulan") ||
    name.includes("3 bulan") ||
    code.includes("3_bulan") ||
    code.includes("3month")
  ) {
    return {
      label: "3 Bulan",
      questionLimit: 40,
      isPremium: true,
      priceLabel: PRICE_3_BULAN,
      upgradeOptions: [{ label: "Zoom Premium", priceLabel: PRICE_ZOOM_PREMIUM }],
    };
  }

  if (code.includes("premium") || name.includes("premium")) {
    return {
      label: "Premium",
      questionLimit: 30,
      isPremium: true,
      priceLabel: PRICE_PREMIUM,
      upgradeOptions: [
        { label: "3 Bulan", priceLabel: PRICE_3_BULAN },
        { label: "Zoom Premium", priceLabel: PRICE_ZOOM_PREMIUM },
      ],
    };
  }

  if (code === "monthly") {
    return {
      label: "Premium",
      questionLimit: 30,
      isPremium: true,
      priceLabel: PRICE_PREMIUM,
      upgradeOptions: [
        { label: "3 Bulan", priceLabel: PRICE_3_BULAN },
        { label: "Zoom Premium", priceLabel: PRICE_ZOOM_PREMIUM },
      ],
    };
  }

  if (code.includes("zoom")) {
    return {
      label: "Zoom Premium",
      questionLimit: 40,
      isPremium: true,
      priceLabel: PRICE_ZOOM_PREMIUM,
      upgradeOptions: [],
    };
  }

  if (code === "yearly") {
    return {
      label: "3 Bulan",
      questionLimit: 40,
      isPremium: true,
      priceLabel: PRICE_3_BULAN,
      upgradeOptions: [{ label: "Zoom Premium", priceLabel: PRICE_ZOOM_PREMIUM }],
    };
  }

  if (isPremiumFlag) {
    return {
      label: "Premium",
      questionLimit: PREMIUM_FALLBACK_LIMIT,
      isPremium: true,
      priceLabel: PRICE_PREMIUM,
      upgradeOptions: [
        { label: "3 Bulan", priceLabel: PRICE_3_BULAN },
        { label: "Zoom Premium", priceLabel: PRICE_ZOOM_PREMIUM },
      ],
    };
  }

  return {
    label: "Free",
    questionLimit: FALLBACK_FREE_LIMIT,
    isPremium: false,
    priceLabel: PRICE_FREE,
    upgradeOptions: [
      { label: "Premium", priceLabel: PRICE_PREMIUM },
      { label: "3 Bulan", priceLabel: PRICE_3_BULAN },
      { label: "Zoom Premium", priceLabel: PRICE_ZOOM_PREMIUM },
    ],
  };
}
