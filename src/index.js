export default class SDK {
  // Constants
  static INITIATE_PATH = "/v1/client/user/session/initiate";
  static VALIDATE_PATH = "/v1/client/user/session/validate";
  static QR_CODE_DOM_ID = "otpless_qr_code";
  static LOGIN_WITH_WA_DOM_ID = "otpless_button";
  static STATE_LOCAL_STORAGE_KEY = "OTPless_state";
  static TOKEN_LOCAL_STORAGE_KEY = "OTPless_token";
  static MOBILE = "MOBILE";
  static DESKTOP = "DESKTOP";
  static TABLET = "TABLET";
  static MAX_COUNT_QR_POLLING = 4;
  static TIMEOUT = 300000;
  static DISPLAY_TYPE = "none";

  constructor({ appId, url } = {}) {
    this.isBroswer = this.isBrowser();
    if (!this.isBroswer) {
      throw new Error(
        "window object is missing. Please use the SDK in a browser environment"
      );
    }
    if (!appId) {
      throw new Error("appId not found");
    }
    if (!url) {
      throw new Error("No url provided for the api in the constructor");
    }
    this.url = url;
    this.appId = appId;

    this.qrPollingId = null;
    this.deviceType = this.getDeviceType();
    this.isMobile = this.getIsMobile();
  }

  cleanUpLocalStorage = () => {
    localStorage.removeItem(SDK.STATE_LOCAL_STORAGE_KEY);
    localStorage.removeItem(SDK.TOKEN_LOCAL_STORAGE_KEY);
  };

  healthcheck = async () => {
    await fetch(this.url + "/healthcheck").then((res) => {
      if (res.status >= 400 && res.status <= 499) {
        throw new Error(
          `Encountered ${res.status} while performing healthcheck. Please check the appId and the url`
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

  isBrowser = () => {
    return typeof window !== "undefined" ? true : false;
  };

  getDeviceType = () => {
    let hasTouchScreen = false;
    if ("maxTouchPoints" in navigator) {
      hasTouchScreen = navigator?.maxTouchPoints > 0;
    } else if ("msMaxTouchPoints" in navigator) {
      hasTouchScreen = navigator?.msMaxTouchPoints > 0;
    } else {
      const mQ = matchMedia?.("(pointer:coarse)");
      if (mQ?.media === "(pointer:coarse)") {
        hasTouchScreen = !!mQ.matches;
      } else if ("orientation" in window) {
        hasTouchScreen = true; // deprecated, but good fallback
      }
    }
    if (!hasTouchScreen) {
      return SDK.DESKTOP;
    }
    const UA = navigator.userAgent;
    let isAppleTablet = false;
    isAppleTablet = /\b(iPad|iPod)\b/i.test(UA);
    if (isAppleTablet) {
      return SDK.TABLET;
    }

    let isMobile = /\b(mobile)\b/i.test(UA);

    let isAndroid = /\b(android)\b/i.test(UA);
    if (isMobile) {
      return SDK.MOBILE;
    } else if (isAndroid) {
      return SDK.TABLET;
    }

    return SDK.DESKTOP;
  };

  getIsMobile = () => {
    return this.deviceType === SDK.MOBILE;
  };

  initiate = ({ redirectionUrl } = {}) => {
    try {
      const previousOnload = window.onload;
      this.cleanValidation();
      window.onload = async () => {
        if (previousOnload) {
          previousOnload();
        }
        if (this.isBrowser) {
          const button = document.getElementById(SDK.LOGIN_WITH_WA_DOM_ID);
          const img = document.getElementById(SDK.QR_CODE_DOM_ID);
          if (this.isMobile) {
            img.style.display = SDK.DISPLAY_TYPE;
            button.onclick = this.createOnClick(redirectionUrl);
          } else {
            button.style.display = SDK.DISPLAY_TYPE;
            const getQr = this.getQR({ redirectionUrl });
            getQr();
            this.qrPollingId = window.setInterval(getQr, SDK.TIMEOUT);
          }
        }
      };
    } catch (e) {
      console.error(`ERROR: ${e}`);
    }
  };

  clearInitate = () => {
    clearInterval(this.qrPollingId);
  };

  startValidation = () => {
    if (this.isMobile) {
      return this.validateMobile();
    }
    return this.validatePolling();
  };

  validateMobile = async () => {
    if (this.isBroswer && this.isMobile) {
      const params = new URLSearchParams(window.location.search);

      const clientState = localStorage.getItem("OTPless_state");

      if (params.has("token")) {
        const token = params.get("token");
        console.log(token);
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
          return Promise.resolve({ isValidated: true, token });
        }
        return Promise.resolve({ isValidated: false, token: null });
      }
    }
  };

  validatePolling = async () => {
    if (this.isBrowser && !this.isMobile) {
      let attempts = 0;
      const as = async (resolve, reject) => {
        const token = localStorage.getItem("OTPless_token");
        const clientState = localStorage.getItem("OTPless_state");
        if (token) {
          const bodyParams = {
            token,
            state: clientState,
          };

          const options = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              appId: this.appId,
            },
            body: JSON.stringify(bodyParams),
          };
          const isValidated = await fetch(this.url + SDK.VALIDATE_PATH, options)
            .then((res) => {
              if (res.ok) {
                return true;
              } else if (res.status >= 500) {
                console.error(
                  `ERROR: ${res.status} while validating token. ${res.statusText}`
                );
              }
              return false;
            })
            .catch(() => {
              return false;
            });

          if (isValidated) {
            return resolve({ isValidated: true, token });
          } else if (attempts > 10) {
            return reject({ isValidated: false, token: null });
          }
          attempts++;
        }
        setTimeout(as, 5000, resolve, reject);
      };
      return new Promise(as);
    }
    return { isValidated: false, token: null };
  };

  cleanValidation = () => {
    this.cleanUpLocalStorage();
  };

  getQR = ({ redirectionUrl }) => {
    let pollingCount = 0;
    let shouldReferesh = false;
    return async () => {
      if (pollingCount < SDK.MAX_COUNT_QR_POLLING) {
        const data = await this.getData({ redirectionUrl });
        if (data && data.intent) {
          document.getElementById(SDK.QR_CODE_DOM_ID).src = data && data.intent;
          data && localStorage.setItem("OTPless_token", data.token);
          pollingCount++;
        }
      } else if (
        pollingCount === SDK.MAX_COUNT_QR_POLLING &&
        shouldReferesh === false
      ) {
        const node = document.getElementById(SDK.QR_CODE_DOM_ID);
        node.src =
          "https://user-images.githubusercontent.com/46546412/124144853-90b23d00-da49-11eb-9f8c-4bbf28f74b3c.png";
        node.onclick = () => {
          pollingCount = 0;
          shouldReferesh = false;
        };
        shouldReferesh = true;
      }
    };
  };

  getData = async function ({ redirectionUrl } = {}) {
    if (this.isBrowser) {
      const clientState = this.makeState(5);
      const bodyParams = {
        loginMethod: "WHATSAPP",
        state: clientState,
        expiryTime: 30,
        redirectionUrl,
        deviceType: this.deviceType,
      };
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json", appId: this.appId },
        body: JSON.stringify(bodyParams),
      };

      const data = await fetch(this.url + SDK.INITIATE_PATH, options)
        .then((res) => {
          if (res.ok) {
            localStorage.setItem("OTPless_state", clientState);
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
    }
  };

  createOnClick = (redirectionUrl) => {
    if (this.isBrowser) {
      return async () => {
        const data = await this.getData({ redirectionUrl });
        const intent = data && data.intent;
        intent && window.location.replace(intent);
      };
    }
  };
}
