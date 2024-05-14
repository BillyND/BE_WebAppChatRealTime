function replaceEncodeEmailFromCurrentUrl(email) {
  try {
    var url = window.location.href;
    const searchParams = new URLSearchParams(url);
    var urlObj = new URL(url);
    const encode = btoa(email);
    searchParams.set("email", encode);
    var newUrl =
      urlObj.origin + urlObj.pathname + `?email=${searchParams.get("email")}`;
    window.history.replaceState({ path: newUrl }, "", newUrl);
    console.log({ newUrl });
  } catch (e) {
    console.log(e);
  }
}
