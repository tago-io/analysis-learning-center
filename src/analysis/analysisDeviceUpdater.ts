import { queue } from "async";

import { Analysis, Resources } from "@tago-io/sdk";
import { TagoContext } from "@tago-io/sdk/lib/types";

async function resolveDevice({ sensor_id }: { context: TagoContext; sensor_id: string }) {
  const [battery] = await Resources.devices.getDeviceData(sensor_id, { variables: "battery_level", qty: 1 });
  if (!battery) {
    return console.log("No data");
  }

  const paramList = await Resources.devices.paramList(sensor_id);
  const batteryParamID = paramList.find((x) => x.key === "battery_level")?.id;
  await Resources.devices.paramSet(sensor_id, { id: batteryParamID, key: "battery_level", value: String(battery.value), sent: false });
}

async function deviceUpdater(context: TagoContext): Promise<void> {
  console.log("Running Analysis...");
  const sensorList = await Resources.devices.listStreaming({
    //@ts-ignore
    filter: {
      tags: [{ key: "device_type", value: "sensor" }],
    },
  });

  const resolveQueue = queue(resolveDevice, 10);

  for await (const deviceList of sensorList) {
    for (const device of deviceList) {
      const sensor_id = device.id;
      void resolveQueue.push({ context, sensor_id });
    }
  }

  if (resolveQueue.started) {
    await resolveQueue.drain();
  }
}

Analysis.use(deviceUpdater, { token: process.env.T_ANALYSIS_TOKEN });
