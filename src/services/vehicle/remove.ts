import { Resources } from "@tago-io/sdk";

import getDevice from "../../lib/get-device";
import { RouterConstructorCustomBtn } from "../../types";

async function deleteVehicle({ scope, context }: RouterConstructorCustomBtn) {
  const vehicle_id = scope[0].device;

  if (!vehicle_id) {
    throw "Vehicle not found!";
  }

  const { tags: vehicle_tags } = await Resources.devices.info(vehicle_id);
  const file_url = vehicle_tags.find((x) => x.key === "vehicle_img")?.value;
  const site_id = vehicle_tags.find((x) => x.key === "site_id")?.value as string;

  if (file_url) {
    await Resources.files.delete([file_url]);
  }

  // delete vehicle info from site device: sensor_history variable
  const site_dev = await getDevice(site_id);
  await site_dev.deleteData({ variables: ["sensor_history", "vehicle_sensor_location"], groups: vehicle_id });
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
  context.log("Analysis Finished");
}

export { deleteVehicle };
