// Probe which Battle.net API namespaces / realms exist for WoW Forever.
// Usage:
//   node --env-file=.env scripts/probe.mjs                       -> list realms per namespace
//   node --env-file=.env scripts/probe.mjs <realm-slug> <name>   -> also try the character profile

const { BNET_CLIENT_ID, BNET_CLIENT_SECRET, BNET_REGION = 'eu' } = process.env;
if (!BNET_CLIENT_ID || !BNET_CLIENT_SECRET) {
  console.error('Missing BNET_CLIENT_ID / BNET_CLIENT_SECRET in .env');
  process.exit(1);
}
const region = BNET_REGION.trim().toLowerCase();
const api = `https://${region}.api.blizzard.com`;

// Known Classic namespaces plus guesses for Forever.
const NAMESPACE_KEYS = ['classic1x', 'classic', 'forever', 'classicforever', 'classic-forever', 'classicplus', 'classic60'];

async function getToken() {
  const res = await fetch('https://oauth.battle.net/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${BNET_CLIENT_ID}:${BNET_CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function get(token, path, namespace) {
  const res = await fetch(`${api}${path}${path.includes('?') ? '&' : '?'}namespace=${namespace}&locale=en_US`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let body = null;
  try { body = await res.json(); } catch {}
  return { status: res.status, body };
}

const token = await getToken();
console.log(`✅ Got access token (region: ${region})\n`);

console.log('── Realm index per namespace ──');
for (const key of NAMESPACE_KEYS) {
  const ns = `dynamic-${key}-${region}`;
  const { status, body } = await get(token, '/data/wow/realm/index', ns);
  if (status === 200 && body?.realms) {
    console.log(`\n[${status}] ${ns}: ${body.realms.length} realms`);
    for (const r of body.realms) console.log(`   ${r.slug.padEnd(28)} ${r.name}`);
  } else {
    console.log(`[${status}] ${ns}`);
  }
}

const [realmSlug, charName] = process.argv.slice(2);
if (realmSlug && charName) {
  console.log(`\n── Character ${charName} @ ${realmSlug} ──`);
  for (const key of NAMESPACE_KEYS) {
    const ns = `profile-${key}-${region}`;
    const { status, body } = await get(
      token,
      `/profile/wow/character/${encodeURIComponent(realmSlug.toLowerCase())}/${encodeURIComponent(charName.toLowerCase())}`,
      ns,
    );
    const summary = status === 200
      ? `level ${body.level} ${body.race?.name ?? ''} ${body.character_class?.name ?? ''} (realm: ${body.realm?.name})`
      : '';
    console.log(`[${status}] ${ns} ${summary}`);
  }
}
