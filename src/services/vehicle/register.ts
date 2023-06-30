import { Resources } from "@tago-io/sdk";
import { DeviceCreateInfo } from "@tago-io/sdk/lib/types";
import { Data } from "@tago-io/sdk/src/common/common.types";

import validation from "../../lib/validation";
import { ServiceParams } from "../../types";

/**
 * @Description Gets sensor information from the scope
 */
async function getNewVehicleVariables(scope: Data[]) {
  const new_vehicle_name = scope.find((x) => x.variable === "new_vehicle_name");
  const new_vehicle_serie = scope.find((x) => x.variable === "new_vehicle_serie");
  const new_vehicle_img = scope.find((x) => x.variable === "new_vehicle_img");
  const new_vehicle_sensor = scope.find((x) => x.variable === "new_vehicle_sensor");

  return {
    vehicleName: new_vehicle_name?.value as string,
    serieNumber: new_vehicle_serie?.value,
    image: new_vehicle_img?.metadata?.file?.url,
    sensor_id: new_vehicle_sensor?.value as string,
  };
}

/**
 * @Description Creates a new vehicle device
 */
async function installDevice({ new_dev_name, org_id, site_id, sensor_id, vehicle_serie }) {
  const device_data: DeviceCreateInfo = {
    name: new_dev_name,
    type: "mutable",
    connector: "5f5a8f3351d4db99c40dece5",
    network: "5bbd0d144051a50034cd19fb",
  };

  const new_dev = await Resources.devices.create(device_data as any);

  await Resources.devices.edit(new_dev.device_id, {
    tags: [
      { key: "vehicle_id", value: new_dev.device_id },
      { key: "sensor_id", value: sensor_id },
      { key: "site_id", value: site_id },
      { key: "organization_id", value: org_id },
      { key: "device_type", value: "vehicle" },
      { key: "vehicle_serie", value: vehicle_serie },
    ],
  });

  return new_dev.device_id;
}

/**
 * @Description Receives vehicle data and creates a new vehicle device
 */
async function createVehicle({ scope }: ServiceParams) {
  const org_id = scope[0].device;
  const validate = await validation("vehicle_validation", org_id);
  await validate("Registering...", "warning");
  const { sensor_id, image, vehicleName, serieNumber } = await getNewVehicleVariables(scope);

  if (vehicleName != undefined && vehicleName.length < 3) {
    await validate("Vehicle name must be at least 3 characters long", "danger");
  }

  const site_info = await Resources.devices.info(sensor_id);
  const site_id = site_info.tags.find((x) => x.key === "site_id")?.value;

  if (!site_id) {
    return Promise.reject(await validate("Site id not found!", "danger"));
  }

  const vehicle_id = await installDevice({
    new_dev_name: vehicleName,
    org_id,
    site_id: site_id,
    sensor_id,
    vehicle_serie: serieNumber,
  });

  // updating sensor device with vehicle_id
  const { tags: sensor_tags } = await Resources.devices.info(sensor_id);
  //@ts-ignore
  sensor_tags.find((x) => x.key === "vehicle_id").value = vehicle_id;
  //@ts-ignore
  sensor_tags.find((x) => x.key === "has_vehicle").value = "true";

  await Resources.devices.edit(sensor_id, { tags: sensor_tags });
  await Resources.devices.paramSet(vehicle_id, { key: "image_urllink", value: image });
  return validate("Vehicle created successfully!", "success");
}

export { createVehicle };
