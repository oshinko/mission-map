export function getEndpoint(suffix: string) {
  return process.env.ENDPOINT!.replace(/\/+$/, '') + suffix;
}
