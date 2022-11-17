export const logger = ({ responseCode, message, location }:any) => {
  console.error({
    errorMessage: `${message} (${location} in otpless-js-sdk.js)`,
    responseCode,
  });
};
