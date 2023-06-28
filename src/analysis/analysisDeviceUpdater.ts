import { queue } from "async";

import { Analysis, Resources } from "@tago-io/sdk";

import { TagoContext } from "../types";

async function resolveSensorQueue(data: any) {
  const { context, sensor_id } = data;
  void resolveDevice(context, sensor_id);
}

async function resolveDevice(context: TagoContext, sensor_id: string) {
  const device_data = await Resources.devices.getDeviceData(sensor_id);
  const battery = device_data.find((x) => x.variable === "battery_status_life")?.value as string;
  if (!battery) {
    return context.log("No data");
  }

  const old_params = await Resources.devices.paramList(sensor_id);
  const old_battery_param = old_params.find((x) => x.key === "battery_level")?.id;
  if (old_battery_param) {
    await Resources.devices.paramSet(sensor_id, { value: String(battery), sent: false }, old_battery_param);
  } else {
    await Resources.devices.paramSet(sensor_id, { key: "battery_level", value: String(battery), sent: false });
  }
  return context.log("device updated Finished");
}

async function deviceUpdater(context: TagoContext): Promise<void> {
  context.log("Running Analysis");

  const sensorList = await Resources.devices.listStreaming({
    //@ts-ignore
    filter: {
      tags: [{ key: "device_type", value: "sensor" }],
    },
  });
  const resolveQueue = queue(resolveSensorQueue, 5);

  for await (const deviceList of sensorList) {
    for (const device of deviceList) {
      const site_id = device.tags.find((tag) => tag.key === "site_id")?.value;
      if (!site_id) {
        throw "Sensor not assigned to a Site";
      }
      const sensor_id = device.id;
      const data = { context, sensor_id };
      void resolveQueue.push(data);
    }
  }

  await resolveQueue.drain();
  context.log("Analysis Finished");
}

Analysis.use(deviceUpdater, { token: process.env.T_ANALYSIS_TOKEN });

export { deviceUpdater };
