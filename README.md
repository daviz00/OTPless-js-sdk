# otpless-js-sdk

Otpless-js-sdk is a JS SDK used for authenticating users using WhatsApp. The SDK can be used in both client side and server side applications.

## Features

- Get WhatsApp intent for redirecting users to WhatsApp from login page.
- Validate OTPless token received after authenticating users using WhatsApp.

## Getting Started

1.  Install the otpless-js-sdk from the npm repository.

    ```sh
    npm i otpless-js-sdk
    ```

2.  Initialize the sdk. `appId` is required. `enableErrorLogging` is an optional parameter. On setting it to true, the error logs are consoled on the stderr (console.error).

    ```sh
    import SDK from "otpless-js-sdk";

    const otplessSdk = new SDK({
    appId: YOUR_APP_ID,
    enableErrorLogging: true,
    });
    ```

3.  Perform health-check while developing to see if the API is working fine.

    ```sh
    otplessSdk.healthcheck().then((res)=>{
        console.log(res)
        }
    );
    ```

4.  Call `createGetIntent` method and pass redirectionURL as one of the object properties. Create an onClick function and call the function returned by `createGetIntent`.

    ```sh
    //client side application

      const getIntent = otplessSdk.getIntent({
    redirectionURL: YOUR_WEBSITE_URL,
    });

    const onClickForLoginWithWhatsApp = () => {
        return getIntent().then((intent) => {
            location.assign(intent);
        });
    };

    //server side application

    const getIntent=otplessSdk.getIntent({
    redirectionURL: YOUR_WEBSITE_URL, });
    const intent=getIntent();
    const state=otplessSdk.getState()

    //Pass the `intent` and `state` to client. Redirect the client to the intent URI and save the state in the cookie/local_storage.

    ```

5.  Once the client completes the WhatsApp authentication, it would be redirected to the URI passed in the `createGetIntent` method with the token passed in the query parameters

    1.  In client side applications call the function `startValidation`. This would extract the `token` from the query parameters and validate the token. The return type is a promise which resolves to the object mentioned below. The object has a property called `stateMatched`. This is set to true only when the client initiates and validates the token in the same browser/app and device. This can be used to make sure that the link cannot be forwarded.

    ```sh
        {
             token: null, stateMatched: false
        }
    ```

    ```sh
    otplessSdk.startValidation().then(({stateMatched,token})=>{
    // if token is not null, user has been authenticated successfully
    })
    ```

    2.  On server side applications, extract the token and send it along with the state to your server

    ```sh

    //client side

     const token=otplessSdk.getTokenFromQueryParams();
    // send the token and the state that was earlier generated to the server side


     //server side

      otplessSdk.validateToken({token,"STATE"}).then(({stateMatched,token}) => {
         // if token is not null, user has been authenticated successfully
        }
    );
    ```

6.  The token generated in the last step can now be used to fetch user data. However user data is only provided on the server side. So the client would have to send the token to their server and fetch the data using function `getUserData` on the server side. The function takes in two params `appSecret` and `token`. Make sure not to share the appSecret in the client side.

    ```sh
    const data = await getUserData({appSecret:YOUR_APP_SECRET,token:YOUR_APP_TOKEN})
    ```

## License

MIT

**Free Software, Hell Yeah!**
