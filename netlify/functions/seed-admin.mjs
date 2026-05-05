export default async function handler(request) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_EMAIL,
    ADMIN_INITIAL_PASSWORD,
    SEED_ADMIN_TOKEN,
  } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_EMAIL || !ADMIN_INITIAL_PASSWORD || !SEED_ADMIN_TOKEN) {
    return json({ error: "Missing required environment variables" }, 500);
  }

  const token = request.headers.get("x-seed-token");
  if (token !== SEED_ADMIN_TOKEN) {
    return json({ error: "Unauthorized" }, 401);
  }

  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_INITIAL_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: "Santiago Pérez",
        role: "admin",
        must_change_password: true,
      },
    }),
  });

  const userBody = await userResponse.json().catch(() => ({}));
  if (!userResponse.ok && userBody?.msg !== "A user with this email address has already been registered") {
    return json({ error: "Could not create admin user", details: userBody }, userResponse.status);
  }

  const adminId = userBody?.id || (await findUserIdByEmail(SUPABASE_URL, headers, ADMIN_EMAIL));
  if (!adminId) return json({ error: "Admin user exists but id could not be resolved" }, 500);

  const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify({
      id: adminId,
      email: ADMIN_EMAIL,
      full_name: "Santiago Pérez",
      role: "admin",
      must_change_password: true,
    }),
  });

  if (!profileResponse.ok) {
    return json({ error: "Could not upsert admin profile", details: await profileResponse.text() }, profileResponse.status);
  }

  return json({
    ok: true,
    email: ADMIN_EMAIL,
    message: "Admin seeded. Force a password change after first login.",
  });
}

async function findUserIdByEmail(supabaseUrl, headers, email) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=200`, { headers });
  const body = await response.json().catch(() => ({}));
  const users = Array.isArray(body?.users) ? body.users : [];
  return users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id || null;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
