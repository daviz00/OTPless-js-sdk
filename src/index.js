import fetch from "cross-fetch";
export default class SDK {
  // Constants
  static INITIATE_PATH = "/v1/client/user/session/initiate";
  static VALIDATE_PATH = "/v1/client/user/session/validate";
  static HEALTH_CHECK = "/healthcheck";
  static STATE_LOCAL_STORAGE_KEY = "OTPless_state";

  constructor({ appId, url } = {}) {
    this.isBrowser = this.getIsBrowser();
    if (!appId) {
      throw new Error("appId not found");
    }
    if (!url) {
      throw new Error("No url provided for the api in the constructor");
    }
    this.url = url;
    this.appId = appId;
    this.state = null;
  }

  getIsBrowser = () => {
    return typeof window !== "undefined" ? true : false;
  };

  cleanUpLocalStorage = () => {
    if (this.isBrowser) {
      localStorage.removeItem(SDK.STATE_LOCAL_STORAGE_KEY);
    }
  };

  healthcheck = async () => {
    return await fetch(this.url + SDK.HEALTH_CHECK).then((res) => {
      if (res.ok) {
        return "OK";
      }
      if (res.status >= 400 && res.status <= 499) {
        throw new Error(
          `Encountered ${res.status} while performing healthcheck. Please check the appId and the url`
        );
      } else {
        throw new Error(
          `Encountered ${res.status} while performing healthcheck.`
        );
      }
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

  getTokenFromQueryParams = () => {
    if (this.isBrowser) {
      const params = new URLSearchParams(window.location.search);
      return params.get("token");
    }
  };

  validateToken = async (token) => {
    if (token) {
      const clientState = localStorage.getItem(SDK.STATE_LOCAL_STORAGE_KEY);
      const bodyParams = {
        token,
        state: clientState,
      };
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json", appId: this.appId },
        body: JSON.stringify(bodyParams),
      };
      const isValidated = await fetch(
        this.url + SDK.VALIDATE_PATH,
        options
      ).then((res) => {
        if (res.ok) {
          return true;
        }
        return false;
      });

      if (isValidated) {
        return { isValidated: true, token };
      }
      return { isValidated: false, token: null };
    }
  };

  getState = () => {
    return this.isBrowser
      ? localStorage.getItem(SDK.STATE_LOCAL_STORAGE_KEY)
      : this.state;
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
        const isValidated = await fetch(
          this.url + SDK.VALIDATE_PATH,
          options
        ).then((res) => {
          if (res.ok) {
            return true;
          }
          return false;
        });

        if (isValidated) {
          this.cleanUpLocalStorage();
          return Promise.resolve({ isValidated: true, token });
        }
        return Promise.resolve({ isValidated: false, token: null });
      }
    }
    return Promise.resolve({ isValidated: false, token: null });
  };

  getData = async function ({ redirectionURL } = {}) {
    const clientState = this.makeState(5);
    const bodyParams = {
      loginMethod: "WHATSAPP",
      state: clientState,
      expiryTime: 30,
      redirectionURL,
    };
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json", appId: this.appId },
      body: JSON.stringify(bodyParams),
    };

    const data = await fetch(this.url + SDK.INITIATE_PATH, options)
      .then((res) => {
        if (res.ok) {
          this.isBrowser &&
            localStorage.setItem(SDK.STATE_LOCAL_STORAGE_KEY, clientState);
          this.state = clientState;
          return res.json();
        }
        throw new Error(`${res.status} occured while fetching whatsApp intent. ${res.statusText}
          `);
      })
      .then((res) => {
        const { data } = res;
        return data;
      })
      .catch((error) => {
        console.error(error);
        return null;
      });
    return data;
  };

  getIntent = ({ redirectionURL } = {}) => {
    return async () => {
      this.cleanUpLocalStorage();
      const data = await this.getData({ redirectionURL });
      const intent = data && data.intent;
      return intent;
    };
  };
}
