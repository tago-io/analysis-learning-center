import { queue } from "async";

import { Resources } from "@tago-io/sdk";

import { fetchDeviceList } from "../../lib/fetch-device-list";
import { ServiceParams } from "../../types";

async function deleteSite({ config_dev, scope }: ServiceParams) {
  if (!scope[0].device) {
    throw "Site not found!";
  }
  const { id: config_dev_id } = await config_dev.info();
  const site_id = scope[0].device;
  const site_tags = await Resources.devices.info(site_id);
  const org_id = site_tags.tags.find((x) => x.key === "organization_id")?.value as string;

  await config_dev.deleteData({ groups: site_id, qty: 9999 });
  await Resources.devices.deleteDeviceData(org_id, {
    groups: site_id,
    qty: 9999,
  });

  await Resources.devices.deleteDeviceData(org_id, {
    groups: site_id,
    qty: 9999,
  });

  const user_accounts = await Resources.run.listUsers({
    filter: { tags: [{ key: "site_id", value: site_id }] },
  });

  if (user_accounts) {
    for (const user of user_accounts) {
      await Resources.run.userDelete(user.id as string);
      await Resources.devices.deleteDeviceData(org_id, { groups: user.id, qty: 9999 });
      await Resources.devices.deleteDeviceData(config_dev_id, { groups: user.id, qty: 9999 });
    }
  }

  const devices = await fetchDeviceList({
    tags: [{ key: "site_id", value: site_id }],
  });

  async function deleteData(device: any) {
    await Resources.devices.delete(device.id); /*passing the device id*/
    await Resources.devices.deleteDeviceData(org_id, { groups: device.id, qty: 9999 }).then((msg) => msg);
    await Resources.devices.deleteDeviceData(config_dev_id, { groups: device.id, qty: 9999 });
  }

  const deleteQueue = queue(deleteData, 5);
  deleteQueue.error((error: any) => console.log(error));

  if (devices) {
    for (const device of devices) {
      void deleteQueue.push(device);
    }
  }

  await deleteQueue.drain();
  return;
}

export { deleteSite };
