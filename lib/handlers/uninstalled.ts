import { SmartAppContext } from "@smartthings/smartapp"

export default function (context: SmartAppContext, updateData: any) {
    
    console.log("Tado SmartApp being uninstalled")
    context.api.subscriptions.delete('securityModeChangeHandler')
}