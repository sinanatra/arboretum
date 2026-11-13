export async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${url} (HTTP ${response.status}).`);
  return response.json();
}
