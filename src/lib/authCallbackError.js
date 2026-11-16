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
      title: "We couldn’t complete sign-in",
      message: "Please try again. You can also sign in with your email and password.",
    };
  }

  if (errorCode === "access_denied") {
    return {
      title: "Sign-in was not completed",
      message: "You can try again or sign in with your email and password.",
    };
  }

  return {
    title: "We couldn’t complete sign-in",
    message: "Please try again. You can also sign in with your email and password.",
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
