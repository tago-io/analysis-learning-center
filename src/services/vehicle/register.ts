import { Device, Resources, Utils } from "@tago-io/sdk";
import { Data } from "@tago-io/sdk/src/common/common.types";

import { parseTagoObject } from "../../lib/data.logic";
import validation from "../../lib/validation";
import { DeviceCreated, ServiceParams } from "../../types";

async function getNewVehicleVariables(scope: Data[]) {
  const new_vehicle_name = scope.find((x) => x.variable === "new_vehicle_name");
  const new_vehicle_serie = scope.find((x) => x.variable === "new_vehicle_serie");
  const new_vehicle_img = scope.find((x) => x.variable === "new_vehicle_img");
  const new_vehicle_asset = scope.find((x) => x.variable === "new_vehicle_asset");

  return {
    vehicle_name: new_vehicle_name?.value as string,
    serieNumber: new_vehicle_serie?.value,
    image: {
      fileName: new_vehicle_img?.value,
      url: new_vehicle_img?.metadata?.file?.url,
    },
    sensor_id: new_vehicle_asset?.value as string,
  };
}

async function installDevice({ new_dev_name, org_id, site_id, asset_id, vehicle_serie, vehicle_img }) {
  const device_data = {
    name: new_dev_name,
    type: "mutable",
    connector: "5f5a8f3351d4db99c40dece5",
    network: "5bbd0d144051a50034cd19fb",
  };

  const new_dev = await Resources.devices.create(device_data as any);

  await Resources.devices.edit(new_dev.device_id, {
    tags: [
      { key: "vehicle_id", value: new_dev.device_id },
      { key: "sensor_id", value: asset_id },
      { key: "site_id", value: site_id },
      { key: "organization_id", value: org_id },
      { key: "device_type", value: "vehicle" },
      { key: "vehicle_serie", value: vehicle_serie },
      { key: "vehicle_img", value: vehicle_img },
    ],
  });

  const new_org_dev = new Device({ token: new_dev.token });

  return { ...new_dev, device: new_org_dev } as DeviceCreated;
}

async function createVehicle({ scope, environment }: ServiceParams) {
  const org_id = scope[0].device;
  const validate = await validation("vehicle_validation", org_id);
  await validate("Registering...", "warning");
  const { sensor_id, image, vehicle_name: vehicleName, serieNumber } = await getNewVehicleVariables(scope);

  if (vehicleName != undefined && vehicleName.length < 3) {
    await validate("Equipment name must be at least 3 characters long", "danger");
  }

  await Resources.dashboards.edit(environment.dash_org, {});

  const [asset_name] = await org_dev.getData({ variables: "dev_name", groups: sensor_id, qty: 1 }); // need to change this to resources

  const asset_id = asset_name?.group;

  if (!asset_id) {
    throw "Asset id not found";
  }

  const site_id = (await Resources.devices.info(asset_id)).tags.find((x) => x.key === "site_id")?.value;

  if (!site_id) {
    throw "Site id not found!";
  }

  const { device_id: vehicle_id } = await installDevice({
    new_dev_name: vehicleName,
    org_id,
    site_id: site_id,
    asset_id,
    vehicle_serie: serieNumber,
    vehicle_img: image.url,
  });

  const vehicle_data = parseTagoObject(
    {
      vehicle_name: vehicleName,
      vehicle_img: image.url,
      vehicle_asset: vehicle_id,
      vehicle_serie: serieNumber,
    },
    vehicle_id
  );

  // const { tags: asset_dev_tags } = await account.devices.info(asset_id);
  // const tagResolver = TagResolver(asset_dev_tags);
  // tagResolver.setTag("equipment_id", equip_id);
  // tagResolver.setTag("has_equip", "true");
  // await tagResolver.apply(account, assetID);

  const { tags: asset_dev_tags } = await Resources.devices.info(asset_id); // do i need these lines?
  await Resources.devices.edit(asset_id, {
    ...asset_dev_tags, // do i need these lines?
    tags: [
      { key: "vehicle_id", value: vehicle_id },
      { key: "has_vehicle", value: "true" },
    ],
  });

  await Resources.devices.sendDeviceData(org_id, vehicle_data);
  await Resources.devices.sendDeviceData(site_id, vehicle_data);

  return validate("Vehicle created successfully!", "success");
}

export { createVehicle };
