import { queue } from "async";

import { Resources } from "@tago-io/sdk";
import { DeviceListItem } from "@tago-io/sdk/lib/types";

import { ServiceParams } from "../../types";

/**
 * @Description Deletes the selected organization device along with all its related users and devices
 */
async function deleteOrganization({ scope }: ServiceParams) {
  const org_id = scope[0].device;
  if (!org_id) {
    return;
  }

  const user_accounts = await Resources.run.listUsers({
    filter: { tags: [{ key: "organization_id", value: org_id }] },
  });

  if (user_accounts) {
    for (const user of user_accounts) {
      void Resources.run.userDelete(user.id as string);
    }
  }

  const device_list = Resources.devices.listStreaming({
    //@ts-ignore
    filter: {
      tags: [{ key: "organization_id", value: org_id }],
    },
  });

  /**
   * @Description Deletes a device
   */
  const deleteDevice = async (device: DeviceListItem) => await Resources.devices.delete(device.id);
  const deleteQueue = queue(deleteDevice, 5);

  deleteQueue.error((error: any) => console.log(error));

  if (device_list) {
    for await (const devices of device_list) {
      for (const device of devices) {
        void deleteQueue.push(device);
      }
    }
  }

  if (deleteQueue.started) {
    await deleteQueue.drain();
  }
}

export { deleteOrganization };
