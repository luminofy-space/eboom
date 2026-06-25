export function parseRouteParam(value: string | string[] | undefined): number {
  return parseInt(Array.isArray(value) ? value[0] : value ?? "", 10);
}
