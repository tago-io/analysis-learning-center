import { queue } from "async";

import { Resources } from "@tago-io/sdk";

import { ServiceParams } from "../../types";

async function deleteSite({ scope }: ServiceParams) {
  const site_id = scope[0].device;

  const user_accounts = await Resources.run.listUsers({
    filter: { tags: [{ key: "site_id", value: site_id }] },
  });

  if (user_accounts) {
    for (const user of user_accounts) {
      await Resources.run.userDelete(user.id as string);
    }
  }

  const device_list = await Resources.devices.listStreaming({
    tags: [{ key: "site_id", value: site_id }],
  });

  async function deleteDevice(device: any) {
    await Resources.devices.delete(device.id);
  }

  const deleteQueue = queue(deleteDevice, 5);
  deleteQueue.error((error: any) => console.log(error));

  if (device_list) {
    for await (const devices of device_list) {
      for (const device of devices) {
        void deleteQueue.push(device);
      }
    }
  }

  await deleteQueue.drain();
  return;
}

export { deleteSite };
