const AUTH_ERROR_PARAMS = ["error", "error_code", "error_description", "error_uri"];

export function getAuthCallbackError(urlLike) {
  const url = new URL(urlLike);
  const query = url.searchParams;
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const getParam = (name) => query.get(name) || hash.get(name);
  const error = getParam("error");

  if (!error) return null;

  const errorCode = getParam("error_code") || "";
  const errorDescription = getParam("error_description") || "";
  const description = errorDescription.toLowerCase();

  if (description.includes("unable to exchange external code")) {
    return {
      title: "Social sign-in could not be completed",
      message: "The provider returned you to Supabase, but Supabase Auth could not exchange the authorization code for account tokens. This usually means the provider's Client ID and Client Secret saved in Supabase do not belong to the same OAuth app, or the secret is incorrect or expired.",
      steps: [
        "Open the OAuth app for the provider you selected (for Google, use Google Cloud Console) and locate the web OAuth client used for RitualOS.",
        "Confirm its authorized redirect URI exactly matches the Supabase callback URL shown in Admin → Social sign-in.",
        "Copy the Client ID and current Client Secret from that same OAuth client into the matching provider under Supabase → Authentication → Sign In / Providers, then save.",
        "Retry in a private window. If it still fails, inspect Supabase Auth logs at the time of the attempt; the provider token-exchange response will give the specific cause.",
      ],
    };
  }

  if (errorCode === "access_denied") {
    return {
      title: "Sign-in was not completed",
      message: "The sign-in provider denied or canceled the request. You can try again or use email and password.",
      steps: [],
    };
  }

  return {
    title: "Social sign-in failed",
    message: "The identity provider or Supabase Auth could not complete the sign-in. Check the provider configuration and allowed redirect URLs, then try again.",
    steps: [],
  };
}

export function getUrlWithoutAuthError(urlLike) {
  const url = new URL(urlLike);
  AUTH_ERROR_PARAMS.forEach((name) => url.searchParams.delete(name));

  if (url.hash.startsWith("#")) {
    const hash = new URLSearchParams(url.hash.slice(1));
    AUTH_ERROR_PARAMS.forEach((name) => hash.delete(name));
    const remainingHashParams = [...hash].filter(([, value]) => value !== "");
    url.hash = remainingHashParams.length
      ? new URLSearchParams(remainingHashParams).toString()
      : "";
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
