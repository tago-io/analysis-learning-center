import { Device, Resources } from "@tago-io/sdk";

export default async function getDevice(device_id: string) {
  const [dev_info] = await Resources.devices.list({
    filter: { id: device_id },
  });

  const [dev_token] = await Resources.devices.tokenList(dev_info.id, {
    filter: { permission: "full" },
  });

  if (!dev_token.token) {
    throw `Did not receive Device token of Device with id: ${device_id}, have you correctly created the Device?`;
  }

  return new Device({ token: dev_token.token });
}
