import { SectionSetting, SmartApp } from "@smartthings/smartapp";
import updatedHandler from "./lib/handlers/updated";
import uninstalledHandler from "./lib/handlers/uninstalled";
import securityArmStateEventHandler from "./lib/handlers/securityModeChange";

const smartApp = new SmartApp()
  .enableEventLogging(2)
  .appId(process.env.APP_ID!)
  .clientId(process.env.CLIENT_ID!)
  .clientSecret(process.env.CLIENT_SECRET!)
  .permissions(["r:security:locations:*:armstate"])
  .disableCustomDisplayName(true)
  .page("mainPage", (_, page) => {
    page.name("Tado SmartThings Integration");
    page.section("Instructions", (section) => {
      section.paragraphSetting("info").name("Instructions")
        .description(`When installing, you'll need to authenticate with Tado using the OAuth2 device flow. Check your phone SMS for the URL to visit. 
            Once authenticated, the app will be able to control your Tado presence based on the SmartThings Home Monitor state.`);
    });
  })
  .installed(updatedHandler)
  .subscribedSecurityArmStateEventHandler(
    "securityModeChangeHandler",
    securityArmStateEventHandler
  )
  .uninstalled(uninstalledHandler);

export default smartApp;
