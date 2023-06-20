import { Resources } from "@tago-io/sdk";
import { Data } from "@tago-io/sdk/src/common/common.types";

import { parseTagoObject } from "../../lib/data.logic";
import validation from "../../lib/validation";
import { ServiceParams } from "../../types";

function getNewOrgVariables(scope: Data[]) {
  const name = scope.find((x) => x.variable === "new_org_name")
    ?.value as string;
  const address = scope.find((x) => x.variable === "new_org_address") as Data;

  return { name, address };
}

async function installDevice({ new_org_name }) {
  const device_data = {
    name: new_org_name,
    type: "mutable",
    connector: "5f5a8f3351d4db99c40dece5",
    network: "5bbd0d144051a50034cd19fb",
  };

  const new_org = await Resources.devices.create(device_data as any);

  await Resources.devices.edit(new_org.device_id, {
    tags: [
      { key: "organization_id", value: new_org.device_id },
      { key: "device_type", value: "organization" },
    ],
  });

  return new_org.device_id;
}

async function createOrganization({ scope, config_dev }: ServiceParams) {
  const validate = validation("org_validation", config_dev);
  await validate("Registering...", "warning");

  const { name: new_org_name, address: new_org_address } =
    await getNewOrgVariables(scope);

  const [org_exists] = await config_dev.getData({
    variables: "org_name",
    values: new_org_name,
    qty: 1,
  });

  if (org_exists) {
    throw await validate("Organization name already exists", "danger");
  }

  if ((new_org_name as string)?.length < 3) {
    throw await validate(
      "Organization name must be at least 3 characters long",
      "danger"
    );
  }

  const device_id = await installDevice({
    new_org_name: new_org_name,
  });

  const [dashboard] = await Resources.dashboards.list({
    filter: { label: "Organization Resources" },
  });

  const { id: config_dev_id } = await config_dev.info();

  const org_data = {
    org_id: device_id,
    org_name: {
      value: new_org_name,
      metadata: {
        url: `https://admin.tago.io/dashboards/info/${dashboard.id}?settings_device=${config_dev_id}&organization_device=${device_id}`,
      },
    },
    org_address: {
      value: new_org_address.value,
      location: new_org_address.location,
    },
  };

  await Resources.devices.sendDeviceData(
    config_dev_id,
    parseTagoObject(org_data, device_id)
  );

  await Resources.devices.paramSet(device_id, {
    key: "url_link",
    value: `https://admin.tago.io/dashboards/info/${dashboard.id}?settings_device=${config_dev_id}&organization_device=${device_id}`,
  });
  await Resources.devices.paramSet(device_id, {
    key: "address",
    value: new_org_address.value as string,
  });

  return await validate("Organization created", "success");
}

export { createOrganization };
