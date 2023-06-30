import { Resources } from "@tago-io/sdk";

import { RouterConstructorCustomBtn } from "../../types";

/**
 * @Description Deletes the selected vehicle device and dealocates it sensor
 */
async function deleteVehicle({ scope }: RouterConstructorCustomBtn) {
  const vehicle_id = scope[0].device;

  if (!vehicle_id) {
    throw "Vehicle not found!";
  }

  const { tags: vehicle_tags } = await Resources.devices.info(vehicle_id);
  const site_id = vehicle_tags.find((x) => x.key === "site_id")?.value as string;

  const vehicle_params = await Resources.devices.paramList(vehicle_id);
  const file_url = vehicle_params.find((x) => x.key === "image_urllink")?.value as string;

  if (file_url) {
    console.log(await Resources.files.delete([file_url]));
  }

  await Resources.devices.deleteDeviceData(site_id, { variables: ["sensor_history", "vehicle_sensor_location"], groups: vehicle_id });
  await Resources.devices.delete(vehicle_id);

  const sensor_id = scope.find((x) => x.property === "tags.sensor_id")?.value;
  if (!sensor_id) {
    throw "sensor id not found";
  }

  const { tags: sensor_tags } = await Resources.devices.info(sensor_id);
  //@ts-ignore
  sensor_tags.find((x) => x.key === "vehicle_id").value = "none";
  //@ts-ignore
  sensor_tags.find((x) => x.key === "has_vehicle").value = "false";
  await Resources.devices.edit(sensor_id, { tags: sensor_tags });
}

export { deleteVehicle };
