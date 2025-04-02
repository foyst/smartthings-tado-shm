import { SmartAppContext } from "@smartthings/smartapp";
import { AppEvent } from "@smartthings/smartapp/lib/lifecycle-events";
import { Tado } from "node-tado-client";
import {
  GetParameterCommand,
  ParameterNotFound,
  ParameterTier,
  ParameterType,
  PutParameterCommand,
  SSMClient,
} from "@aws-sdk/client-ssm";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { env } from "process";

const ssmClient = new SSMClient();
const snsClient = new SNSClient();
const REFRESH_TOKEN_PARAMETER_NAME = "/smartthings-tado/refresh-token";

export default async function (
  context: SmartAppContext,
  eventData: AppEvent.SecurityArmStateEvent,
  eventTime?: string
): Promise<any> {
  const alarmState = eventData.armState;
  console.log("Home Monitor state is now " + alarmState);

  switch (alarmState) {
    case "ARMED_AWAY": {
      console.log("Settingo Tado to Away");
      const tadoClient = await authenticateTadoClient();
      const homeId = (await tadoClient.getMe()).homes[0].id;
      tadoClient.setPresence(homeId, "AWAY");
      break;
    }
    case "ARMED_STAY": {
      console.log("SHM set to Armed Stay, do nothing");
      break;
    }
    case "DISARMED": {
      console.log("Settingo Tado to Home");
      const tadoClient = await authenticateTadoClient();
      const homeId = (await tadoClient.getMe()).homes[0].id;
      tadoClient.setPresence(homeId, "HOME");
      break;
    }
    default: {
      const errorMessage = `Unknown alarm state received: ${alarmState}`;
      console.error(errorMessage);
      throw new Error(`Unknown alarm state received: ${alarmState}`);
    }
  }
}
async function authenticateTadoClient() {
  const refreshToken = await getRefreshTokenFromParameterStore();
  const tadoClient = new Tado();
  const [verify, futureToken] = await tadoClient.authenticate(refreshToken);
  if (verify) {
    console.log(
      "Tado authentication required. Please visit the following website in a browser:"
    );
    console.log(`${verify.verification_uri_complete}`);
    await snsClient.send(
      new PublishCommand({
        Message: `Tado authentication required for SmartThings integration. 
Please visit the following website in a browser: ${verify.verification_uri_complete}`,
        PhoneNumber: env.MOBILE_NUMBER,
        MessageAttributes: {
          "AWS.SNS.SMS.SenderID": {
            DataType: "String",
            StringValue: "SMARTHOME",
          },
        },
      })
    );
  }
  console.log("Waiting for Tado authentication...");
  await futureToken;
  console.log("Tado authentication complete.");

  await putRefreshTokenToParameterStore((await futureToken).refresh_token);
  return tadoClient;
}

async function putRefreshTokenToParameterStore(token: string) {
  const input = {
    Name: REFRESH_TOKEN_PARAMETER_NAME,
    Value: token,
    Type: ParameterType.SECURE_STRING,
    Overwrite: true,
    Tier: ParameterTier.STANDARD,
    DataType: "text",
  };
  const command = new PutParameterCommand(input);
  await ssmClient.send(command);
}

async function getRefreshTokenFromParameterStore(): Promise<
  string | undefined
> {
  const input = {
    Name: REFRESH_TOKEN_PARAMETER_NAME,
    WithDecryption: true,
  };
  const command = new GetParameterCommand(input);
  try {
    const response = await ssmClient.send(command);
    return response.Parameter?.Value;
  } catch (error) {
    if (error instanceof ParameterNotFound) {
      return undefined;
    }
    throw error;
  }
}
