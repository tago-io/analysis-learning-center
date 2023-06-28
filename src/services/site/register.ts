import { Resources } from "@tago-io/sdk";
import { DeviceCreateInfo } from "@tago-io/sdk/lib/types";
import { Data } from "@tago-io/sdk/src/common/common.types";

import validation from "../../lib/validation";
import { ServiceParams } from "../../types";

async function getNewSiteVariables(scope: Data[]) {
  const name = scope.find((x) => x.variable === "new_site_name")?.value as string;
  const address = scope.find((x) => x.variable === "new_site_address") as Data;

  return { name, address };
}

async function installDevice({ site_name, org_id }) {
  const device_data: DeviceCreateInfo = {
    name: site_name,
    type: "mutable",
    connector: "5f5a8f3351d4db99c40dece5", // custom https
    network: "5bbd0d144051a50034cd19fb", // custom https
  };

  const new_site = await Resources.devices.create(device_data);

  await Resources.devices.edit(new_site.device_id, {
    tags: [
      { key: "site_id", value: new_site.device_id },
      { key: "organization_id", value: org_id },
      { key: "device_type", value: "site" },
    ],
  });

  return new_site.device_id;
}

async function createSite({ scope }: ServiceParams) {
  const org_id = scope[0].device;
  const validate = await validation("site_validation", org_id);
  await validate("Registering...", "warning");
  const { name: new_site_name, address: new_site_address } = await getNewSiteVariables(scope);

  const [site_exists] = await Resources.devices.list({ filter: { name: new_site_name } });

  if (site_exists) {
    throw await validate("Site name already exists", "danger");
  }

  if (new_site_name.length < 3) {
    throw await validate("Site name must be at least 3 characters long", "danger");
  }

  const site_id = await installDevice({
    site_name: new_site_name,
    org_id,
  });

  const [dashboard] = await Resources.dashboards.list({
    filter: { label: "Site Dashboard" },
  });

  await Resources.devices.paramSet(site_id, [
    {
      key: "url_link",
      value: `https://admin.tago.io/dashboards/info/${dashboard.id}/?organization=${org_id}&site=${site_id}`,
    },
    {
      key: "site_address",
      value: new_site_address.value as string,
    },
  ]);

  return await validate("Site successfully created!", "success");
}

export { createSite };
