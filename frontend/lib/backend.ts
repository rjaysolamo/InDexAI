// Only server-side calls use this URL. Browsers use the same-origin API proxy.
export function backendUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:8080"
  ).replace(/\/+$/, "");
}
