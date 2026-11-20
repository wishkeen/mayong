import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const serviceKey = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default;
const publishableKey = () => Deno.env.get("SUPABASE_ANON_KEY") || JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}").default;

const adminDb = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  serviceKey(),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

function equalConstantTime(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function hmac(algorithm: "SHA-1" | "SHA-256", secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: algorithm }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
}

async function encrypt(value: string) {
  const master = Deno.env.get("PAYMENT_CREDENTIALS_KEY");
  if (!master) throw new Error("PAYMENT_CREDENTIALS_KEY is not configured for the payment-gateway function.");
  const keyBytes = Uint8Array.from(atob(master), (c) => c.charCodeAt(0));
  if (keyBytes.length !== 32) throw new Error("PAYMENT_CREDENTIALS_KEY must be a base64 encoded 32-byte key.");
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value));
  return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`;
}

async function decrypt(value: string) {
  if (!value) return "";
  const master = Deno.env.get("PAYMENT_CREDENTIALS_KEY");
  if (!master) throw new Error("PAYMENT_CREDENTIALS_KEY is not configured for the payment-gateway function.");
  const keyBytes = Uint8Array.from(atob(master), (c) => c.charCodeAt(0));
  if (keyBytes.length !== 32) throw new Error("PAYMENT_CREDENTIALS_KEY must be a base64 encoded 32-byte key.");
  const [ivPart, cipherPart] = value.split(".");
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: Uint8Array.from(atob(ivPart), (c) => c.charCodeAt(0)) },
    key,
    Uint8Array.from(atob(cipherPart), (c) => c.charCodeAt(0)),
  );
  return new TextDecoder().decode(plain);
}

async function requireUser(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new Error("Sign in to continue.");
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, publishableKey(), {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) throw new Error("Your session has expired. Sign in again.");
  return user;
}

async function requireAdmin(db: ReturnType<typeof adminDb>, userId: string) {
  const { data, error } = await db.from("profiles").select("role").eq("id", userId).single();
  if (error || data?.role !== "admin") throw new Error("Administrator access is required.");
}

const redirectBase = (_request: Request) => {
  const configured = Deno.env.get("APP_URL");
  if (!configured) throw new Error("Set APP_URL to your public HTTPS app URL in Supabase function secrets.");
  const url = new URL(configured);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") throw new Error("APP_URL must use HTTPS outside local development.");
  return url.origin;
};

async function providerSettings(db: ReturnType<typeof adminDb>, provider: string, environment: string) {
  const { data, error } = await db.from("payment_gateway_settings").select("*").eq("provider", provider).eq("environment", environment).single();
  if (error || !data) throw new Error("Payment gateway is not configured.");
  return {
    ...data,
    apiSecret: await decrypt(data.secret_encrypted),
    webhookSecret: await decrypt(data.webhook_secret_encrypted),
  };
}

function apiBase(provider: string, environment: string) {
  if (provider === "razorpay") return "https://api.razorpay.com/v1";
  return environment === "test" ? "https://test.instamojo.com" : "https://api.instamojo.com";
}

async function instamojoToken(settings: Record<string, string>) {
  const base = apiBase("instamojo", settings.environment);
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: settings.public_key,
    client_secret: settings.apiSecret,
  });
  const response = await fetch(`${base}/oauth2/token/`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new Error(result.error_description || result.error || "Instamojo authentication failed.");
  return { base, token: result.access_token as string };
}

async function razorpayFetch(settings: Record<string, string>, path: string, init: RequestInit = {}) {
  const authorization = btoa(`${settings.public_key}:${settings.apiSecret}`);
  const response = await fetch(`${apiBase("razorpay", settings.environment)}${path}`, {
    ...init,
    headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/json", ...init.headers },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.description || "Razorpay API request failed.");
  return result;
}

async function markPaid(db: ReturnType<typeof adminDb>, order: Record<string, unknown>, paymentId: string) {
  const { error } = await db.rpc("finalize_payment_order", {
    local_order_id: order.id,
    gateway_provider: order.payment_mode,
    gateway_order_id: order.gateway_order_id,
    gateway_payment_id: paymentId,
  });
  if (error) throw error;
}

async function verifyRazorpay(db: ReturnType<typeof adminDb>, order: Record<string, unknown>, body: Record<string, string>, settings: Record<string, string>) {
  const expected = hex(await hmac("SHA-256", settings.apiSecret, `${body.razorpay_order_id}|${body.razorpay_payment_id}`));
  if (!equalConstantTime(expected, body.razorpay_signature || "")) throw new Error("Razorpay payment signature could not be verified.");
  if (body.razorpay_order_id !== order.gateway_order_id) throw new Error("Payment does not match this RitualOS order.");
  const payment = await razorpayFetch(settings, `/payments/${encodeURIComponent(body.razorpay_payment_id)}`);
  const expectedAmount = Math.round(Number(order.amount) * 100);
  if (payment.order_id !== order.gateway_order_id || payment.amount !== expectedAmount || payment.currency !== "INR") {
    throw new Error("The payment amount or order does not match.");
  }
  if (payment.status !== "captured") throw new Error("Payment has not been captured yet. Access will be granted after confirmation.");
  await markPaid(db, order, payment.id);
}

async function verifyInstamojo(db: ReturnType<typeof adminDb>, order: Record<string, unknown>, paymentId: string, requestId: string, settings: Record<string, string>) {
  if (requestId !== order.gateway_order_id) throw new Error("Payment does not match this RitualOS order.");
  const { base, token } = await instamojoToken(settings);
  const response = await fetch(`${base}/v2/payments/${encodeURIComponent(paymentId)}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payment = await response.json();
  if (!response.ok) throw new Error("Could not verify the Instamojo payment.");
  const paymentRequest = typeof payment.payment_request === "string" ? payment.payment_request : payment.payment_request?.id;
  if (payment.status !== true || Number(payment.amount) !== Number(order.amount) || payment.currency !== "INR") {
    throw new Error("Instamojo has not confirmed the expected payment amount.");
  }
  if (paymentRequest && !paymentRequest.endsWith(requestId)) throw new Error("Payment request reference does not match.");
  await markPaid(db, order, paymentId);
}

async function handleWebhook(request: Request, db: ReturnType<typeof adminDb>) {
  const raw = await request.text();
  if (request.headers.has("x-razorpay-signature")) {
    const signature = request.headers.get("x-razorpay-signature") || "";
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(raw); } catch { return json({ error: "Invalid webhook payload." }, 400); }
    const paymentEntity = (payload.payload as Record<string, { entity?: Record<string, unknown> }>)?.payment?.entity;
    if (!paymentEntity) return json({ received: true });
    const { data: order } = await db.from("orders").select("payment_environment").eq("payment_mode", "razorpay").eq("gateway_order_id", paymentEntity.order_id).maybeSingle();
    if (!order) return json({ received: true });
    const { data: settings } = await db.from("payment_gateway_settings").select("*").eq("provider", "razorpay").eq("environment", order.payment_environment).single();
    if (!settings?.webhook_secret_encrypted) return json({ error: "Razorpay webhook is not configured." }, 503);
    const secret = await decrypt(settings.webhook_secret_encrypted);
    const expected = hex(await hmac("SHA-256", secret, raw));
    if (!equalConstantTime(expected, signature)) return json({ error: "Invalid webhook signature." }, 401);
    if (payload.event !== "payment.captured") return json({ received: true });
    const { data: fullOrder, error } = await db.from("orders").select("*")
      .eq("payment_mode", "razorpay").eq("gateway_order_id", paymentEntity.order_id).maybeSingle();
    if (error) throw error;
    if (fullOrder && paymentEntity.amount === Math.round(Number(fullOrder.amount) * 100) && paymentEntity.currency === "INR") {
      await markPaid(db, fullOrder, String(paymentEntity.id));
    }
    return json({ received: true });
  }

  const params = new URLSearchParams(raw);
  const values = Object.fromEntries(params.entries());
  const suppliedMac = values.mac || "";
  delete values.mac;
  const { data: orderConfig } = await db.from("orders").select("payment_environment").eq("payment_mode", "instamojo").eq("gateway_order_id", values.payment_request_id).maybeSingle();
  if (!orderConfig) return json({ received: true });
  const { data: settings } = await db.from("payment_gateway_settings").select("*").eq("provider", "instamojo").eq("environment", orderConfig.payment_environment).single();
  if (!settings?.webhook_secret_encrypted) return json({ error: "Instamojo webhook is not configured." }, 503);
  const secret = await decrypt(settings.webhook_secret_encrypted);
  const message = Object.entries(values).sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase())).map(([, value]) => value).join("|");
  const expected = hex(await hmac("SHA-1", secret, message));
  if (!equalConstantTime(expected, suppliedMac)) return json({ error: "Invalid webhook signature." }, 401);
  if (values.status !== "Credit") return json({ received: true });
  const { data: order, error } = await db.from("orders").select("*")
    .eq("payment_mode", "instamojo").eq("gateway_order_id", values.payment_request_id).maybeSingle();
  if (error) throw error;
  if (order) await verifyInstamojo(db, order, values.payment_id, values.payment_request_id, await providerSettings(db, "instamojo", order.payment_environment));
  return json({ received: true });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const db = adminDb();
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("webhook") === "1") return await handleWebhook(request, db);

    const user = await requireUser(request);
    const body = await request.json();
    if (body.action === "public_status") {
      const { data, error } = await db.from("payment_gateway_runtime")
        .select("enabled, provider, environment").eq("id", 1).maybeSingle();
      if (error) throw error;
      return json({ enabled: Boolean(data?.enabled), provider: data?.provider || "", environment: data?.environment || "" });
    }
    if (body.action.startsWith("admin_")) await requireAdmin(db, user.id);

    if (body.action === "admin_get") {
      const { data, error } = await db.from("payment_gateway_settings").select("provider, enabled, environment, public_key, secret_encrypted, webhook_secret_encrypted, updated_at");
      if (error) throw error;
      return json({ providers: ["razorpay", "instamojo"].flatMap((provider) => ["test", "live"].map((environment) => {
        const row = data.find((item) => item.provider === provider && item.environment === environment);
        return {
          provider,
          enabled: row?.enabled || false,
          environment: row?.environment || "test",
          publicKey: provider === "razorpay" ? row?.public_key || "" : "",
          configured: Boolean(row?.secret_encrypted && row?.webhook_secret_encrypted && (provider !== "razorpay" || row?.public_key)),
        };
      })), webhookUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-gateway?webhook=1` });
    }

    if (body.action === "admin_disable") {
      const { error } = await db.from("payment_gateway_settings").update({ enabled: false, updated_by: user.id, updated_at: new Date().toISOString() }).eq("enabled", true);
      if (error) throw error;
      return json({ ok: true });
    }

    if (body.action === "admin_save") {
      const provider = body.provider;
      if (!["razorpay", "instamojo"].includes(provider)) throw new Error("Choose a supported payment gateway.");
      if (!["test", "live"].includes(body.environment)) throw new Error("Choose test or live mode.");
      const { data: old } = await db.from("payment_gateway_settings").select("*").eq("provider", provider).eq("environment", body.environment).maybeSingle();
      const apiSecretEnc = body.apiSecret ? await encrypt(body.apiSecret.trim()) : old?.secret_encrypted || "";
      const webhookSecretEnc = body.webhookSecret ? await encrypt(body.webhookSecret.trim()) : old?.webhook_secret_encrypted || "";
      const publicKey = String(body.publicKey || body.clientId || old?.public_key || "").trim();
      const hasComplete = Boolean(apiSecretEnc && webhookSecretEnc && publicKey);
      if (body.enabled && !hasComplete) throw new Error("Add the required credentials and webhook secret before activation.");
      if (body.enabled) {
        const { error: disableError } = await db.from("payment_gateway_settings").update({ enabled: false }).eq("enabled", true);
        if (disableError) throw disableError;
      }
      const { error } = await db.from("payment_gateway_settings").upsert({
        provider,
        enabled: Boolean(body.enabled),
        environment: body.environment,
        public_key: publicKey,
        secret_encrypted: apiSecretEnc,
        webhook_secret_encrypted: webhookSecretEnc,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "provider,environment" });
      if (error) throw error;
      return json({ ok: true });
    }

    if (body.action === "admin_test") {
      const settings = await providerSettings(db, body.provider, body.environment);
      if (body.provider === "razorpay") await razorpayFetch(settings, "/payments?count=1");
      else await instamojoToken(settings);
      return json({ ok: true, message: "Gateway credentials are valid." });
    }

    if (body.action === "create_checkout") {
      const { data: unlockSettings, error: unlockError } = await db.from("ritual_unlock_settings").select("mode").eq("id", 1).single();
      if (unlockError) throw unlockError;
      if (unlockSettings.mode !== "current") throw new Error("Online checkout is disabled while administrator approval mode is selected.");
      const providerRow = (await db.from("payment_gateway_settings").select("provider, environment").eq("enabled", true).maybeSingle());
      if (providerRow.error) throw providerRow.error;
      if (!providerRow.data) throw new Error("Online payments are not currently available.");
      const provider = providerRow.data.provider;
      const environment = providerRow.data.environment;
      const settings = await providerSettings(db, provider, environment);
      const { data: ritual, error: ritualError } = await db.from("rituals").select("id, name, price, is_published").eq("id", body.ritual_id).single();
      if (ritualError || !ritual?.is_published) throw new Error("This ritual is unavailable.");
      const amount = Number(ritual.price);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Free rituals do not require online checkout.");
      if (provider === "instamojo" && (amount < 9 || amount > 200000)) throw new Error("Instamojo supports payments from ₹9 up to ₹2,00,000 per transaction.");
      const { data: existing, error: existingError } = await db.from("entitlements").select("id").eq("user_id", user.id).eq("ritual_id", ritual.id).maybeSingle();
      if (existingError) throw existingError;
      if (existing) throw new Error("You already have access to this ritual.");
      const { data: pending, error: pendingError } = await db.from("orders").select("id, amount, ritual_name, gateway_order_id, checkout_url")
        .eq("user_id", user.id).eq("ritual_id", ritual.id).eq("payment_mode", provider).eq("payment_environment", environment).eq("status", "pending")
        .order("created_date", { ascending: false }).limit(1).maybeSingle();
      if (pendingError) throw pendingError;
      let order = pending;
      if (order?.gateway_order_id) {
        if (provider === "razorpay") return json({ provider, orderId: order.id, gatewayOrderId: order.gateway_order_id, amount: Math.round(Number(order.amount) * 100), currency: "INR", keyId: settings.public_key, name: "RitualOS", description: order.ritual_name, prefill: { email: user.email || "" } });
        if (order.checkout_url) return json({ provider, orderId: order.id, paymentUrl: order.checkout_url });
      }
      if (!order) {
        const { data, error: orderError } = await db.from("orders").insert({
          user_id: user.id, created_by_id: user.id, ritual_id: ritual.id, ritual_name: ritual.name,
          amount, currency: "INR", status: "pending", payment_mode: provider, payment_environment: environment,
        }).select("id, amount, ritual_name, gateway_order_id, checkout_url").single();
        if (orderError) throw orderError;
        order = data;
      }
      if (provider === "razorpay") {
        const gatewayOrder = await razorpayFetch(settings, "/orders", {
          method: "POST",
          body: JSON.stringify({
            amount: Math.round(amount * 100), currency: "INR", receipt: order.id,
            notes: { ritualos_order_id: order.id, ritualos_user_id: user.id },
          }),
        });
      const { error } = await db.from("orders").update({ gateway_order_id: gatewayOrder.id }).eq("id", order.id);
        if (error) throw error;
        return json({ provider, orderId: order.id, gatewayOrderId: gatewayOrder.id, amount: gatewayOrder.amount, currency: "INR", keyId: settings.public_key, name: "RitualOS", description: order.ritual_name, prefill: { email: user.email || "" } });
      }
      const appUrl = redirectBase(request);
      const { base, token } = await instamojoToken(settings);
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-gateway?webhook=1`;
      const redirectUrl = `${appUrl}/ritual/${encodeURIComponent(ritual.id)}?payment_provider=instamojo&order_id=${encodeURIComponent(order.id)}`;
      const requestBody = new URLSearchParams({
        amount: amount.toFixed(2), purpose: order.ritual_name.slice(0, 100), email: user.email || "",
        redirect_url: redirectUrl, webhook: webhookUrl, allow_repeated_payments: "False", send_email: "False",
      });
      const response = await fetch(`${base}/v2/payment_requests/`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" }, body: requestBody,
      });
      const paymentRequest = await response.json();
      if (!response.ok) throw new Error(paymentRequest.message || "Could not start Instamojo checkout.");
      const gatewayOrderId = paymentRequest.id;
      const paymentUrl = paymentRequest.longurl || paymentRequest.long_url || paymentRequest.url;
      if (!gatewayOrderId || !paymentUrl) throw new Error("Instamojo returned an incomplete payment link.");
      const { error } = await db.from("orders").update({ gateway_order_id: gatewayOrderId, checkout_url: paymentUrl }).eq("id", order.id);
      if (error) throw error;
      return json({ provider, orderId: order.id, paymentUrl });
    }

    if (body.action === "verify_payment") {
      const { data: order, error } = await db.from("orders").select("*").eq("id", body.orderId).eq("user_id", user.id).single();
      if (error || !order) throw new Error("Payment order was not found.");
      if (order.status === "paid") return json({ ok: true, orderId: order.id });
      const settings = await providerSettings(db, order.payment_mode, order.payment_environment);
      if (order.payment_mode === "razorpay") await verifyRazorpay(db, order, body, settings);
      else if (order.payment_mode === "instamojo") await verifyInstamojo(db, order, body.paymentId, body.paymentRequestId, settings);
      else throw new Error("Unsupported payment provider.");
      return json({ ok: true, orderId: order.id });
    }

    throw new Error("Unknown payment action.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment request failed.";
    const status = message.includes("Sign in") ? 401 : message.includes("Administrator") ? 403 : 400;
    return json({ error: message }, status);
  }
});
