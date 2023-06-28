import { Analysis, Resources } from "@tago-io/sdk";
import { Data } from "@tago-io/sdk/src/common/common.types";
import { DeviceInfo } from "@tago-io/sdk/src/modules/Resources/devices.types";

import { parseTagoObject } from "../lib/data.logic";
import getDevice from "../lib/get-device";
import { TagoContext } from "../types";

function getSensorInfoOutside(vehicle: DeviceInfo, outdoor_data: Data, vehicle_img: string) {
  return parseTagoObject(
    {
      vehicle_sensor_location: {
        value: vehicle.name,
        location: {
          lat: outdoor_data?.location?.coordinates[1],
          lng: outdoor_data?.location?.coordinates[0],
        },
        metadata: {
          img_pin: vehicle_img,
        },
      },
    },
    vehicle.id
  );
}

async function assetTracker(context: TagoContext, scope: Data[]) {
  context.log("Running Analysis");

  const device_id = scope[0].device;
  const { tags } = await Resources.devices.info(device_id);

  const vehicle_id = tags.find((x) => x.key === "vehicle_id")?.value;
  if (!vehicle_id) {
    return context.log("Device is not paired with an vehicle");
  }

  const site_id = tags.find((x) => x.key === "site_id")?.value;
  if (!site_id) {
    throw "Device not assigned to a Site";
  }

  const outdoor_data = scope.find((x) => x?.location) as any;

  if (!outdoor_data && !outdoor_data?.location?.coordinates[0]) {
    return false;
  }

  const vehicle_params = await Resources.devices.paramList(vehicle_id);
  const vehicle_img = vehicle_params.find((x) => x.key === "image_urllink")?.value as string;
  const vehicle_info = await Resources.devices.info(vehicle_id);

  const sensorInfo = getSensorInfoOutside(vehicle_info, outdoor_data, vehicle_img);

  const site_dev = await getDevice(site_id);
  await site_dev.deleteData({ variables: ["vehicle_sensor_location"], groups: vehicle_id });
  await site_dev.sendData(sensorInfo);

  // history tracker
  const sensor_history = parseTagoObject(
    {
      sensor_history: {
        value: vehicle_info.name,
        location: {
          lat: outdoor_data?.location?.coordinates[1],
          lng: outdoor_data?.location?.coordinates[0],
        },
        metadata: {
          vehicleurl: vehicle_info,
        },
      },
    },
    vehicle_info.id
  );

  await Resources.devices.sendDeviceData(site_id, sensor_history);
  context.log("Analysis Finished");
}

Analysis.use(assetTracker, { token: process.env.T_ANALYSIS_TOKEN });

export { assetTracker };
