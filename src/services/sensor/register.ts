import { Resources } from "@tago-io/sdk";
import { DeviceCreateInfo } from "@tago-io/sdk/lib/types";
import { Data } from "@tago-io/sdk/src/common/common.types";

import validation from "../../lib/validation";
import { ServiceParams } from "../../types";

async function getNewSensorVariables(scope: Data[]) {
  const new_sensor_name = scope.find((x) => x.variable === "new_sensor_name")?.value as string;
  const new_sensor_type = scope.find((x) => x.variable === "new_sensor_type")?.value as string;
  const new_sensor_eui = scope.find((x) => x.variable === "new_sensor_eui")?.value as string;
  const new_sensor_site = scope.find((x) => x.variable === "new_sensor_site")?.value as string;

  return { new_sensor_name, new_sensor_type, new_sensor_eui, new_sensor_site };
}

async function installDevice({ new_sensor_name, org_id, site_id, connector, new_device_eui }) {
  const device_data: DeviceCreateInfo = {
    name: new_sensor_name,
    network: "5ed7ccd5427104001cf00183",
    serie_number: new_device_eui,
    connector,
    type: "immutable",
    chunk_period: "month",
    chunk_retention: 1,
  };

  const new_dev = await Resources.devices.create(device_data);

  await Resources.devices.edit(new_dev.device_id, {
    tags: [
      { key: "sensor_id", value: new_dev.device_id },
      { key: "vehicle_id", value: "none" },
      { key: "site_id", value: site_id },
      { key: "organization_id", value: org_id },
      { key: "device_type", value: "sensor" },
      { key: "device_eui", value: new_device_eui },
      { key: "device_connector", value: connector },
      { key: "has_vehicle", value: "false" },
    ],
  });

  return new_dev.device_id;
}

async function createSensor({ scope }: ServiceParams) {
  const org_id = scope[0].device;

  const validate = await validation("sensor_validation", org_id);
  await validate("Registering...", "warning");
  const { new_sensor_name, new_sensor_type, new_sensor_eui, new_sensor_site } = await getNewSensorVariables(scope);

  if (new_sensor_name.length < 3) {
    throw await validate("Device name must be at least 3 characters long", "danger");
  }

  const uc_new_sensor_eui = new_sensor_eui.toUpperCase();

  const [dev_name_exists] = await Resources.devices.list({ filter: { name: new_sensor_name } });
  const [dev_eui_exists] = await Resources.devices.list({ filter: { tags: [{ key: "device_eui", value: uc_new_sensor_eui }] } });

  if (dev_name_exists || dev_eui_exists) {
    throw await validate("Sensor with same EUI or Name already exists", "danger");
  }

  const sensor_id = await installDevice({
    new_sensor_name: new_sensor_name,
    org_id,
    site_id: new_sensor_site,
    connector: new_sensor_type,
    new_device_eui: uc_new_sensor_eui,
  });

  await Resources.devices.paramSet(sensor_id, [
    {
      key: "battery_level",
      value: "not_reported",
    },
  ]);

  return await validate("Device created successfully!", "success");
}

export { createSensor };
