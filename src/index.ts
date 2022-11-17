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

  const getIntent = ({ redirectionURL, orderId }: GetIntentParams = {}) => {
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
      });
      const intent = data && data.intent;
      intent ? location.replace(intent) : (isClicked = false);
    };
  };

  return {
    getToken,
    getState,
    getIntent,
  };
};

export default OTPlessSdk;

// export default class SDK {
//   isClicked = false;
//   appId = "";
//   enableErrorLogging = false;
//   url = "";
//   constructor({ appId = "", enableErrorLogging = false, url = URL }) {
//     if (!getIsBrowser()) {
//       throw new Error("window object not defined");
//     }
//     if (!appId) {
//       throw new Error("appId not found");
//     }
//     this.appId = appId;
//     this.enableErrorLogging = enableErrorLogging;
//     this.url = url;
//   }

//   static getTokenFromQueryParams = () => {
//     if (!getIsBrowser()) {
//       return null;
//     }
//     const params = new URLSearchParams(window.location.search);
//     return params.get(TOKEN);
//   };

//   static getState = () => {
//     if (!getIsBrowser()) {
//       return null;
//     }
//     return localStorage.getItem(STATE_LOCAL_STORAGE_KEY);
//   };

//   createGetIntentOnClick = ({ redirectionURL, orderId }) => {
//     if (!getIsBrowser()) {
//       return null;
//     }
//     return async () => {
//       if (this.isClicked) {
//         return null;
//       }
//       this.isClicked = true;
//       cleanUpLocalStorage();
//       const state = makeState(6);
//       localStorage.setItem(STATE_LOCAL_STORAGE_KEY, state);

//       const data = await getData({
//         url: this.url,
//         redirectionURL,
//         state,
//         orderId,
//         enableErrorLogging: this.enableErrorLogging,
//         appId: this.appId,
//       });
//       const intent = data && data.intent;
//       if (intent) {
//         location.replace(intent);
//       } else {
//         this.isClicked = false;
//       }
//     };
//   };
// }
