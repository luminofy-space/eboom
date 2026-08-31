// Re-exports every table and enum so `db/schema` stays a single import
// surface. Tables are defined per domain in the files below.
//
// `columns.ts` is deliberately not re-exported: it holds column builders, not
// tables, and its generic names (`pk`, `createdAt`) do not belong on the
// public `db/schema` surface. Import it directly from the domain files.

export * from "./schemas";
export * from "./reference";
export * from "./identity";
export * from "./finance";
export * from "./workspace";
export * from "./ai";
