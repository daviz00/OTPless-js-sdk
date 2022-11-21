import { LoggerParams } from "../constants/interfaces";

export const logger = ({ responseCode, message, location }: LoggerParams) => {
  console.error({
    errorMessage: `${message} (${location} in otpless-js-sdk.js)`,
    responseCode,
  });
};
