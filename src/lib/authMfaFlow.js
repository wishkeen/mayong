export async function signInWithProvider(provider, returnTo, options = {}) {
  return {
    provider,
    returnTo,
    options,
    status: "pending",
  };
}

export async function resumeMfa() {
  return null;
}

export async function finishSignIn(accessToken, returnTo) {
  if (!accessToken) {
    throw new Error("Missing access token");
  }

  return {
    access_token: accessToken,
    returnTo,
    status: "completed",
  };
}

export async function signInToManageMfa(email, password) {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  return { email, password, status: "pending" };
}
