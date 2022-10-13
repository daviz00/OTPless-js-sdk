# otpless-js-sdk

Otpless-js-sdk is a vanilla javascript SDK used for authenticating users using OTPless in client side application. [Demo video](https://vimeo.com/745277742)

## Features

- Fetch WhatsApp intent and redirect users to WhatsApp.
- Get token from query params
- Get state from local storage

## Getting Started

1.  Install the otpless-js-sdk from the npm repository.

```sh
    npm i otpless-js-sdk
```

2.  Initialize the sdk. `appId` is required. `enableErrorLogging` is an optional parameter. On setting it to true, the error logs are consoled to the stderr.

```sh
   const sdkIntance = new otplessSdk(
           {
               appId: "YOUR_APP_ID",
               enableErrorLogging: true
           }
        );
```

3. create an Onclick function using `createGetIntentOnClick`. It takes `redirectionURL` object property as a parameter. This is the url to which the client is redirected to once it gets a response in WhatsApp.

```sh
   <button
     onClick={test.createGetIntentOnClick({
       redirectionURL: "YOUR_REDIRECTION_URL",
     })}
   >
     Login with WhatsApp
   </button>

```

4. After successfull redirection from WhatsApp, extract the token from query params using the **static** function `getTokenFromQueryParams` and the state from the local storage using the **static** function `getState`. The token along with the state needs to be passed to your server which in turn should make call to OTPless server for user details.

```sh
   const token=otplessSdk.getTokenFromQueryParams();
   const state=otplessSdk.getState()

```

## License

MIT

**Free Software, Hell Yeah!**
Made with ❤️ by [OTPless](https://www.otpless.com)
