import { Resources } from "@tago-io/sdk";

import { RouterConstructorCustomBtn } from "../../types";

async function updateSensorDevice(sensor_id: string) {
  const { tags: sensor_dev_tags } = await Resources.devices.info(sensor_id);
  await Resources.devices.edit(sensor_id, {
    ...sensor_dev_tags,
    tags: [
      { key: "equipment_id", value: "none" },
      { key: "has_vehicle", value: "false" },
    ],
  });
}

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

  const sensor_id = scope.find((x) => x.property === "tags.vehicle_id")?.value;
  if (!sensor_id) {
    throw "sensor id not found";
  }
  await updateSensorDevice(sensor_id);
}

export { deleteVehicle };
