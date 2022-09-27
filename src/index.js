import fetch from "cross-fetch";
export default class SDK {
  // Constants
  static INITIATE_PATH = "/v1/client/user/session/initiate";
  static VALIDATE_PATH = "/v1/client/user/session/validate";
  static HEALTH_CHECK = "/healthcheck";
  static STATE_LOCAL_STORAGE_KEY = "OTPless_state";
  static USER_DATA = "/v1/client/user/session/userdata";
  static URL = "https://api.otpless.app";

  constructor({ appId, enableErrorLogging = false, url } = {}) {
    this.isBrowser = this.getIsBrowser();
    if (!appId) {
      throw new Error("appId not found");
    }
    this.appId = appId;
    this.state = null;
    this.enableErrorLogging = enableErrorLogging;
    this.url = url || SDK.URL;
  }

  log = ({ responseCode, message, location }) => {
    if (!this.enableErrorLogging) {
      return;
    }
    console.error({
      errorMessage: `${message} (${location} in otpless-js-sdk.js)`,
      responseCode,
    });
  };

  getIsBrowser = () => {
    return typeof window !== "undefined" ? true : false;
  };

  cleanUpLocalStorage = () => {
    if (this.isBrowser) {
      localStorage.removeItem(SDK.STATE_LOCAL_STORAGE_KEY);
    }
  };

  healthcheck = async () => {
    return await fetch(this.url + SDK.HEALTH_CHECK)
      .then((res) => {
        if (res.ok) {
          return "OK";
        }
        if (res.status >= 400 && res.status <= 499) {
          this.log();
        } else {
          throw new Error(
            `Encountered ${res.status} while performing healthcheck.`
          );
        }
      })
      .catch((e) => {
        throw new Error(e);
      });
  };

  makeState = (length) => {
    var result = "";
    var characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  getState = () => {
    return this.isBrowser
      ? localStorage.getItem(SDK.STATE_LOCAL_STORAGE_KEY)
      : this.state;
  };

  getTokenFromQueryParams = () => {
    if (this.isBrowser) {
      const params = new URLSearchParams(window.location.search);
      return params.get("token");
    }
    return null;
  };

  httpHandler = async (url, options) => {
    return await fetch(url, options)
      .then((res) => {
        return res.json() || {};
      })
      .then((res) => {
        return res;
      })
      .catch((e) => {
        this.log(e);
        return {};
      });
  };

  validateToken = async ({ token, state } = {}) => {
    if (token) {
      const clientState = state;
      const bodyParams = {
        token,
        state: clientState,
      };
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json", appId: this.appId },
        body: JSON.stringify(bodyParams),
      };
      const validationResponse = await this.httpHandler(
        this.url + SDK.VALIDATE_PATH,
        options
      ).then(({ responseCode, message, data }) => {
        if (responseCode >= 200 && responseCode <= 299) {
          this.cleanUpLocalStorage();
          return {
            token,
            stateMatched: data && data.stateMatched,
          };
        }
        this.log({ responseCode, message, location: "validateToken" });
        return { token: null, stateMatched: false };
      });

      return Promise.resolve(validationResponse);
    }
    Promise.resolve({ token: null, stateMatched: false });
  };

  startValidation = async () => {
    if (this.isBrowser) {
      const params = new URLSearchParams(window.location.search);

      const clientState = localStorage.getItem(SDK.STATE_LOCAL_STORAGE_KEY);

      if (params.has("token")) {
        const token = params.get("token");
        const bodyParams = {
          token,
          state: clientState,
        };
        const options = {
          method: "POST",
          headers: { "Content-Type": "application/json", appId: this.appId },
          body: JSON.stringify(bodyParams),
        };
        const validationResponse = await this.httpHandler(
          this.url + SDK.VALIDATE_PATH,
          options
        ).then(({ responseCode, message, data }) => {
          if (responseCode >= 200 && responseCode <= 299) {
            this.cleanUpLocalStorage();
            return {
              token,
              stateMatched: data && data.stateMatched,
            };
          }
          this.log({ responseCode, message, location: "startValidation" });
          return { token: null, stateMatched: false };
        });

        return Promise.resolve(validationResponse);
      }
    }
    return Promise.resolve({ token: null, stateMatched: false });
  };

  createGetIntent = ({ redirectionURL, orderId } = {}) => {
    return async () => {
      this.cleanUpLocalStorage();
      const state = this.makeState(5);
      this.isBrowser &&
        localStorage.setItem(SDK.STATE_LOCAL_STORAGE_KEY, state);
      this.state = state;

      const data = await this.getData({
        redirectionURL,
        state,
        orderId,
      });
      const intent = data && data.intent;
      return intent;
    };
  };

  getData = async function ({ redirectionURL, state, orderId } = {}) {
    const bodyParams = {
      loginMethod: "WHATSAPP",
      state,
      expiryTime: 30,
      redirectionURL,
      orderId,
    };
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json", appId: this.appId },
      body: JSON.stringify(bodyParams),
    };

    const data = await this.httpHandler(
      this.url + SDK.INITIATE_PATH,
      options
    ).then(({ responseCode, message, data }) => {
      if (responseCode >= 200 && responseCode <= 299) {
        return data;
      }
      this.log({ responseCode, message, location: "createGetIntent" });
      return null;
    });

    return data;
  };

  getUserData = async ({ appSecret, token } = {}) => {
    if (!token) {
      console.error("Token is missing in getUserData");
      return null;
    }

    if (!appSecret) {
      console.error("appSecret is missing in getUserData");
      return null;
    }

    const bodyParams = {
      token,
    };
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        appId: this.appId,
        appSecret,
      },
      body: JSON.stringify(bodyParams),
    };

    const data = await this.httpHandler(this.url + SDK.USER_DATA, options).then(
      ({ responseCode, message, data }) => {
        if (responseCode >= 200 && responseCode <= 299) {
          return data;
        }
        this.log({ responseCode, message, location: "getUserData" });
        return null;
      }
    );
    return data;
  };
}
