import { Analysis, Resources } from "@tago-io/sdk";
import { Data, DeviceInfo, TagoContext } from "@tago-io/sdk/lib/types";

import { DataResolver } from "../lib/edit.data";

async function updateSiteMap(vehicle_info: DeviceInfo, outdoor_data: Data, site_id: string) {
  const vehicle_params = await Resources.devices.paramList(vehicle_info.id);
  const vehicle_img = vehicle_params.find((x) => x.key === "image_urllink")?.value as string;

  const dataResolver = DataResolver(site_id);
  dataResolver.setVariable({
    variable: "vehicle_sensor_location",
    value: vehicle_info.name,
    location: outdoor_data?.location,
    group: vehicle_info.id,
    metadata: {
      img_pin: vehicle_img,
    },
  });
  await dataResolver.apply(vehicle_info.id);
}

async function updateHistoryData(vehicle_info: DeviceInfo, outdoor_data: Data, site_id: string) {
  const sensor_history = {
    variable: "sensor_history",
    group: vehicle_info.id,
    value: vehicle_info.name,
    location: outdoor_data?.location,
  };

  await Resources.devices.sendDeviceData(site_id, sensor_history);
  await Resources.devices.deleteDeviceData(site_id, { groups: [vehicle_info.id], skip: 15, variables: "sensor_history" });
}

async function assetTracker(context: TagoContext, scope: Data[]) {
  const sensor_id = scope[0]?.device;

  const { tags } = await Resources.devices.info(sensor_id);

  const vehicle_id = tags.find((x) => x.key === "vehicle_id")?.value;
  if (!vehicle_id) {
    return console.log("Sensor is not paired with an vehicle");
  }

  const site_id = tags.find((x) => x.key === "site_id")?.value;
  if (!site_id) {
    throw "Device not assigned to a Site";
  }

  const outdoor_data = scope.find((x) => x?.location) as any;
  if (!outdoor_data && !outdoor_data?.location?.coordinates[0]) {
    return console.log("location data not found");
  }

  const vehicle_info = await Resources.devices.info(vehicle_id);

  await updateSiteMap(vehicle_info, outdoor_data, site_id);
  await updateHistoryData(vehicle_info, outdoor_data, site_id);
}

Analysis.use(assetTracker, { token: process.env.T_ANALYSIS_TOKEN });
