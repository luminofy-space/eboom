export const toCamel = (str: string) =>
  str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export const snakeToCamel = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel) as T;
  }
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc: Record<string, unknown>, key) => {
      acc[toCamel(key)] = snakeToCamel(obj[key as keyof T]) as unknown;
      return acc as Record<string, unknown>;
    }, {}) as T;
  }
  return obj as unknown as T;
};

export const camelToSnake = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake) as T;
  }
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc: Record<string, unknown>, key) => {
      acc[snakeToCamel(key)] = camelToSnake(obj[key as keyof T]) as unknown;
      return acc as Record<string, unknown>;
    }, {}) as T;
  }
  return obj as unknown as T;
};
