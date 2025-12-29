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
const PRICE_BELAJAR = "Rp 119rb";
const PRICE_PREMIUM = "Rp 149rb";
const PRICE_INTENSIVE = "Rp 199rb";
const PRICE_3_BULAN = "Rp 399rb";

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
        { label: "Belajar", priceLabel: PRICE_BELAJAR },
        { label: "Premium", priceLabel: PRICE_PREMIUM },
        { label: "Intensive", priceLabel: PRICE_INTENSIVE },
        { label: "3 Bulan", priceLabel: PRICE_3_BULAN },
      ],
    };
  }

  if (code.includes("belajar") || name.includes("belajar")) {
    return {
      label: "Belajar",
      questionLimit: 20,
      isPremium: true,
      priceLabel: PRICE_BELAJAR,
      upgradeOptions: [
        { label: "Premium", priceLabel: PRICE_PREMIUM },
        { label: "Intensive", priceLabel: PRICE_INTENSIVE },
      ],
    };
  }

  if (
    code.includes("intensive") ||
    name.includes("intensive") ||
    code.includes("intensif") ||
    name.includes("intensif")
  ) {
    return {
      label: "Intensive",
      questionLimit: 40,
      isPremium: true,
      priceLabel: PRICE_INTENSIVE,
      upgradeOptions: [],
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
      upgradeOptions: [],
    };
  }

  if (code.includes("premium") || name.includes("premium")) {
    return {
      label: "Premium",
      questionLimit: 30,
      isPremium: true,
      priceLabel: PRICE_PREMIUM,
      upgradeOptions: [
        { label: "Intensive", priceLabel: PRICE_INTENSIVE },
      ],
    };
  }

  if (code === "web_monthly") {
    return {
      label: "Belajar",
      questionLimit: 20,
      isPremium: true,
      priceLabel: PRICE_BELAJAR,
      upgradeOptions: [
        { label: "Premium", priceLabel: PRICE_PREMIUM },
        { label: "Intensive", priceLabel: PRICE_INTENSIVE },
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
        { label: "Intensive", priceLabel: PRICE_INTENSIVE },
      ],
    };
  }

  if (code === "weekly_zoom") {
    return {
      label: "Intensive",
      questionLimit: 40,
      isPremium: true,
      priceLabel: PRICE_INTENSIVE,
      upgradeOptions: [],
    };
  }

  if (code === "monthly_zoom") {
    return {
      label: "Intensive",
      questionLimit: 40,
      isPremium: true,
      priceLabel: PRICE_INTENSIVE,
      upgradeOptions: [],
    };
  }

  if (code === "yearly") {
    return {
      label: "3 Bulan",
      questionLimit: 40,
      isPremium: true,
      priceLabel: PRICE_3_BULAN,
      upgradeOptions: [],
    };
  }

  if (isPremiumFlag) {
    return {
      label: "Premium",
      questionLimit: PREMIUM_FALLBACK_LIMIT,
      isPremium: true,
      priceLabel: PRICE_PREMIUM,
      upgradeOptions: [
        { label: "Intensive", priceLabel: PRICE_INTENSIVE },
      ],
    };
  }

  return {
    label: "Free",
    questionLimit: FALLBACK_FREE_LIMIT,
    isPremium: false,
    priceLabel: PRICE_FREE,
    upgradeOptions: [
      { label: "Belajar", priceLabel: PRICE_BELAJAR },
      { label: "Premium", priceLabel: PRICE_PREMIUM },
      { label: "Intensive", priceLabel: PRICE_INTENSIVE },
      { label: "3 Bulan", priceLabel: PRICE_3_BULAN },
    ],
  };
}
