import dayjs from "dayjs";

export const formatGrams = (value: number) =>
  `${new Intl.NumberFormat("en-HK", { maximumFractionDigits: 2 }).format(value)} g`;

export const formatDateTime = (value: string) => dayjs(value).format("D MMM YYYY, h:mm A");

export const formatDate = (value?: string) => (value ? dayjs(value).format("D MMM YYYY") : "—");

export const formatMoney = (value: number, currency = "HKD") => {
  try {
    return new Intl.NumberFormat("en-HK", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency.toUpperCase()} ${value.toFixed(2)}`;
  }
};

export const dateTimeInputValue = (value = new Date().toISOString()) =>
  dayjs(value).format("YYYY-MM-DD HH:mm:ss");
