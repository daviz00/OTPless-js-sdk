import { GET_INTENT_ENDPOINT } from "../constants";
import { getIsBrowser } from "./get-is-browser";
import { logger } from "./logger";
import { DEFAULT_EXPIRY_TIME } from "../constants";
import { WHATSAPP } from "../constants";
import { httpHandler } from "./http-handler";

export const getData = async ({
  url,
  appId,
  redirectionURL,
  state,
  orderId,
  enableErrorLogging,
}) => {
  if (!getIsBrowser()) {
    return null;
  }
  const bodyParams = {
    loginMethod: WHATSAPP,
    state,
    expiryTime: DEFAULT_EXPIRY_TIME,
    redirectionURL,
    orderId,
  };
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json", appId },
    body: JSON.stringify(bodyParams),
  };

  const data = await httpHandler(url + GET_INTENT_ENDPOINT, options).then(
    (res) => {
      const { responseCode, message, data } = res;
      if (responseCode >= 200 && responseCode <= 299) {
        return data;
      }

      enableErrorLogging &&
        responseCode &&
        logger({
          responseCode: responseCode,
          message: message,
          location: "createGetIntent",
        });
      return null;
    }
  );

  return data;
};
