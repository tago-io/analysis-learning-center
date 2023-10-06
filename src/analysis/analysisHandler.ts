import { Analysis, Device, Resources, Utils } from "@tago-io/sdk";
import { Data, TagoContext } from "@tago-io/sdk/lib/types";

import { deleteOrganization } from "../services/organization/delete";
import { createOrganization } from "../services/organization/register";
import { deleteSensor } from "../services/sensor/delete";
import { createSensor } from "../services/sensor/register";
import { deleteSite } from "../services/site/delete";
import { createSite } from "../services/site/register";
import { deleteUser } from "../services/user/delete";
import { createUser } from "../services/user/register";
import { deleteVehicle } from "../services/vehicle/delete";
import { createVehicle } from "../services/vehicle/register";

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

async function analysisHandler(context: TagoContext, scope: Data[]): Promise<void> {
  console.log("SCOPE:", JSON.stringify(scope, null, 4));
  console.log("CONTEXT:", JSON.stringify(context, null, 4));

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

  router.register(createUser as any).whenInputFormID("create-user");
  router.register(deleteUser as any).whenUserListIdentifier("delete-user");

  router.register(createSensor as any).whenInputFormID("create-sensor");
  router.register(deleteSensor as any).whenDeviceListIdentifier("delete-sensor");

  router.register(createVehicle as any).whenInputFormID("create-vehicle");
  router.register(deleteVehicle as any).whenDeviceListIdentifier("delete-vehicle");

  const result = await router.exec();
  console.log("Services found:", result.services);
}

Analysis.use(analysisHandler, { token: process.env.T_ANALYSIS_TOKEN });
