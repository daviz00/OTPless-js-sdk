export const logger = ({ responseCode, message, location }) => {
  console.error({
    errorMessage: `${message} (${location} in otpless-js-sdk.js)`,
    responseCode,
  });
};
