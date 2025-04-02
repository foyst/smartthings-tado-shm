import { SmartAppContext } from "@smartthings/smartapp"

export default function (context: SmartAppContext, updateData: any) {
    
    console.log("Tado SmartApp being installed")
    context.api.subscriptions.subscribeToSecuritySystem('securityModeChangeHandler')
}