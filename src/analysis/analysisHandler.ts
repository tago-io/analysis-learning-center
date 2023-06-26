import { Analysis, Device, Resources, Utils } from "@tago-io/sdk";
import { Data } from "@tago-io/sdk/src/common/common.types";
import { TagoContext } from "@tago-io/sdk/src/modules/Analysis/analysis.types";

import { deleteOrganization } from "../services/organization/delete";
import { editOrganization } from "../services/organization/edit";
import { createOrganization } from "../services/organization/register";
import { editSite } from "../services/site/edit";
import { createSite } from "../services/site/register";
import { deleteSite } from "../services/site/remove";
import { editUser } from "../services/user/edit";
import { createUser } from "../services/user/register";
import { deleteUser } from "../services/user/remove";

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
  router.register(editOrganization as any).whenCustomBtnID("edit-org");
  router.register(deleteOrganization as any).whenDeviceListIdentifier("delete-org");

  router.register(createSite as any).whenInputFormID("create-site");
  router.register(editSite as any).whenCustomBtnID("edit-site"); // not done
  router.register(deleteSite as any).whenDeviceListIdentifier("delete-site");

  router.register(createUser as any).whenInputFormID("create-user"); // dont forget to reactivate emails.
  router.register(editUser as any).whenCustomBtnID("edit-user");
  router.register(deleteUser as any).whenUserListIdentifier("delete-user");

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
