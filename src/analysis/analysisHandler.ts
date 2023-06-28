import { Analysis, Device, Resources, Utils } from "@tago-io/sdk";
import { Data } from "@tago-io/sdk/src/common/common.types";
import { TagoContext } from "@tago-io/sdk/src/modules/Analysis/analysis.types";

import { deleteOrganization } from "../services/organization/delete";
import { createOrganization } from "../services/organization/register";
import { createSensor } from "../services/sensor/register";
import { deleteSensor } from "../services/sensor/remove";
import { createSite } from "../services/site/register";
import { deleteSite } from "../services/site/remove";
import { createUser } from "../services/user/register";
import { deleteUser } from "../services/user/remove";
import { createVehicle } from "../services/vehicle/register";
import { deleteVehicle } from "../services/vehicle/remove";

async function analysisHandler(context: TagoContext, scope: Data[]): Promise<void> {
  console.log("SCOPE:", JSON.stringify(scope, null, 4));
  console.log("CONTEXT:", JSON.stringify(context, null, 4));
  console.log("Running Analysis");

  const config_dev = await getConfigDevice();

  const environment = Utils.envToJson(context.environment);

  const router = new Utils.AnalysisRouter({
    scope,
    context,
    config_dev,
    environment,
  });

  router.register(createOrganization as any).whenInputFormID("create-org");
  router.register(deleteOrganization as any).whenDeviceListIdentifier("delete-org");

  router.register(createSite as any).whenInputFormID("create-site");
  router.register(deleteSite as any).whenDeviceListIdentifier("delete-site");

  router.register(createUser as any).whenInputFormID("create-user"); // Don't forget to reactive email
  router.register(deleteUser as any).whenUserListIdentifier("delete-user");

  router.register(createSensor as any).whenInputFormID("create-sensor");
  router.register(deleteSensor as any).whenDeviceListIdentifier("delete-sensor");

  router.register(createVehicle as any).whenInputFormID("create-vehicle");
  router.register(deleteVehicle as any).whenDeviceListIdentifier("delete-vehicle");

  const result = await router.exec();

  console.log("Services found:", result.services);
}

async function getConfigDevice(): Promise<Device> {
  const [config_dev_info] = await Resources.devices.list({
    filter: { tags: [{ key: "device_type", value: "settings" }] },
  });

  const [config_dev_token] = await Resources.devices.tokenList(config_dev_info.id, { filter: { permission: "full" } });

  if (!config_dev_token.token) {
    throw "Did not receive Settings Device token, have you correctly created the Settings Device?";
  }

  return new Device({ token: config_dev_token.token });
}

Analysis.use(analysisHandler, { token: process.env.T_ANALYSIS_TOKEN });
