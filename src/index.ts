import { makeState } from "./utils/make-state";
import { URL, STATE_LOCAL_STORAGE_KEY, TOKEN } from "./constants";
import { getIsBrowser } from "./utils/get-is-browser";
import { cleanUpLocalStorage } from "./utils/clean-local-storage";
import { getData } from "./utils/get-data";
import { GetIntentParams, SdkParams } from "./constants/interfaces";

const OTPlessSdk = ({
  appId,
  enableErrorLogging = false,
  url = URL,
}: SdkParams = {}) => {
  if (!getIsBrowser()) {
    throw new Error("window object not defined");
  }
  if (!appId) {
    throw new Error("appId not found");
  }

  let isClicked = false;

  const getToken = () => {
    if (!getIsBrowser()) {
      return null;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get(TOKEN);
  };

  const getState = () => {
    if (!getIsBrowser()) {
      return null;
    }
    return localStorage.getItem(STATE_LOCAL_STORAGE_KEY);
  };

  const createGetIntentOnClick = ({ redirectionURL, orderId, expiryTime }: GetIntentParams = {}) => {
    if (!getIsBrowser()) {
      return null;
    }
    return async () => {
      if (isClicked) {
        return null;
      }
      isClicked = true;
      cleanUpLocalStorage();
      const state = makeState(6);
      localStorage.setItem(STATE_LOCAL_STORAGE_KEY, state);

      const data = await getData({
        url,
        redirectionURL,
        state,
        orderId,
        enableErrorLogging,
        appId,
        expiryTime
      });
      const intent = data && data.intent;
      intent ? location.replace(intent) : (isClicked = false);
    };
  };

  return {
    getToken,
    getState,
    createGetIntentOnClick,
  };
};

export default OTPlessSdk;

