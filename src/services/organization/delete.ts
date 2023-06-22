import { queue } from "async";

import { Resources } from "@tago-io/sdk";

import { fetchDeviceList } from "../../lib/fetch-device-list";
import { ServiceParams } from "../../types";

async function deleteOrganization({ config_dev, scope }: ServiceParams) {
  const org_id = scope[0].device;

  await config_dev.deleteData({ groups: org_id, qty: 10_000 });

  const user_accounts = await Resources.run.listUsers({
    filter: { tags: [{ key: "organization_id", value: org_id }] },
  });

  if (user_accounts) {
    for (const user of user_accounts) {
      void Resources.run.userDelete(user.id as string);
    }
  }

  const devices = await fetchDeviceList({
    tags: [{ key: "organization_id", value: org_id }],
  });

  async function deleteDevice(device: any) {
    await config_dev.deleteData({ groups: device.id, qty: 10_000 });
    await Resources.devices.delete(device.id);
  }

  const deleteQueue = queue(deleteDevice, 5);
  deleteQueue.error((error: any) => console.log(error));
  if (devices) {
    for (const device of devices) {
      void deleteQueue.push(device);
    }
  }

  await deleteQueue.drain();
  return;
}

export { deleteOrganization };
