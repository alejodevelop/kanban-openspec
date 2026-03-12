import { CreateCardValidationError } from "./create-card.ts";

export const normalizeTitle = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new CreateCardValidationError("Title is required");
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new CreateCardValidationError("Title is required");
  }

  return normalized;
};

export const normalizeDescription = (value: unknown): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new CreateCardValidationError("Description must be a string when provided");
  }

  const normalized = value.trim();
  return normalized === "" ? null : normalized;
};
