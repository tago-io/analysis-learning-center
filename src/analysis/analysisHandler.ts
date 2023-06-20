import { Analysis, Device, Resources, Utils } from "@tago-io/sdk";
import { Data } from "@tago-io/sdk/src/common/common.types";
import { TagoContext } from "@tago-io/sdk/src/modules/Analysis/analysis.types";

import { editOrganization } from "../services/organization/edit";
import { createOrganization } from "../services/organization/register";

async function analysisHandler(
  context: TagoContext,
  scope: Data[]
): Promise<void> {
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
  router.register(editOrganization as any).whenCustomBtnID("edit-org");

  const result = await router.exec();

  console.log("Services found:", result.services);
}

async function getConfigDevice(): Promise<Device> {
  const [config_dev_info] = await Resources.devices.list({
    filter: { tags: [{ key: "device_type", value: "settings" }] },
  });

  const [config_dev_token] = await Resources.devices.tokenList(
    config_dev_info.id,
    { filter: { permission: "full" } }
  );

  if (!config_dev_token.token) {
    throw "Did not receive Settings Device token, have you correctly created the Settings Device?";
  }

  return new Device({ token: config_dev_token.token });
}

Analysis.use(analysisHandler, { token: process.env.T_ANALYSIS_TOKEN });
