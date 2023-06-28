import { Resources } from "@tago-io/sdk";

import { RouterConstructorCustomBtn } from "../../types";

async function deleteVehicle({ scope }: RouterConstructorCustomBtn) {
  const vehicle_id = scope[0].device;

  if (!vehicle_id) {
    throw "Vehicle not found!";
  }

  const { tags: vehicle_tags } = await Resources.devices.info(vehicle_id);
  const file_url = vehicle_tags.find((x) => x.key === "vehicle_img")?.value;

  if (file_url) {
    await Resources.files.delete([file_url]);
  }

  await Resources.devices.delete(vehicle_id);

  const sensor_id = scope.find((x) => x.property === "tags.sensor_id")?.value;
  if (!sensor_id) {
    throw "sensor id not found";
  }

  const { tags: sensor_tags } = await Resources.devices.info(sensor_id);
  console.log("sensor tags:", sensor_tags as any);
  //@ts-ignore
  sensor_tags.find((x) => x.key === "vehicle_id").value = "none";
  //@ts-ignore
  sensor_tags.find((x) => x.key === "has_vehicle").value = "false";

  console.log("sensor tags:", sensor_tags as any);
  await Resources.devices.edit(sensor_id, { tags: sensor_tags });
}

export { deleteVehicle };
