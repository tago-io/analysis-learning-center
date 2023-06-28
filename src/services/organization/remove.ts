import { queue } from "async";

import { Resources } from "@tago-io/sdk";

import { ServiceParams } from "../../types";

async function deleteOrganization({ scope, context }: ServiceParams) {
  const org_id = scope[0].device;

  const user_accounts = await Resources.run.listUsers({
    filter: { tags: [{ key: "organization_id", value: org_id }] },
  });

  if (user_accounts) {
    for (const user of user_accounts) {
      void Resources.run.userDelete(user.id as string);
      console.log("Deleting user:", user.name);
    }
  }

  const device_list = Resources.devices.listStreaming({
    //@ts-ignore
    filter: {
      tags: [{ key: "organization_id", value: org_id }],
    },
  });

  async function deleteDevice(device: any) {
    await Resources.devices.delete(device.id);
    console.log("Deleting device:", device.name);
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
  context.log("Analysis Finished");
  return;
}

export { deleteOrganization };
