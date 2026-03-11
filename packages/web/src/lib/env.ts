const DEFAULT_API_BASE_URL = "http://localhost:3001";

export type WebEnv = {
  apiBaseUrl: string;
};

const normalizeBaseUrl = (value: string | undefined): string => {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_API_BASE_URL;
  }

  const trimmedValue = value.trim();
  return trimmedValue.endsWith("/") ? trimmedValue.slice(0, -1) : trimmedValue;
};

export const loadWebEnv = (input: ImportMetaEnv = import.meta.env): WebEnv => ({
  apiBaseUrl: normalizeBaseUrl(input.VITE_API_BASE_URL),
});
