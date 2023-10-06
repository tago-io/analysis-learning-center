import { Resources } from "@tago-io/sdk";

import { ServiceParams } from "../../types";

/**
 * @Description Deletes the selected sensor device along with its vehicle if it has one
 */
async function deleteSensor({ scope }: ServiceParams) {
  const dev_id = scope[0].device;
  const device_info = await Resources.devices.info(dev_id);
  const vehicle_id = device_info.tags.find((tag) => tag.key === "vehicle_id")?.value;

  await Resources.devices.delete(dev_id);

  if (vehicle_id) {
    await Resources.devices.delete(vehicle_id);
  }
}
export { deleteSensor };
