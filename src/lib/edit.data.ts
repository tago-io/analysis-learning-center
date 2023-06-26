import { Device, Resources } from "@tago-io/sdk";
import { Data } from "@tago-io/sdk/src/common/common.types";
import { DataToEdit, DataToSend } from "@tago-io/sdk/src/modules/Device/device.types";

/**
 * Creates a resolver to add/update data on the devices.
 * The function automatically identifies if the data already exists or not.
 * @example
 * const editData = DataResolver(device);
 * editData.setVariable({ variable: "data-to-update", value: 1, group: "12312" });
 * await editData.apply();
 *
 * @param {Device} device_id your device id
 * @param debug
 * @returns
 */
async function DataResolver(device_id: string, debug: boolean = false) {
  const variables: string[] = [];
  const newDataList: DataToSend[] = [];
  let oldDataList: Data[] = [];

  const [dev_info] = await Resources.devices.list({
    filter: { id: device_id },
  });

  const [dev_token] = await Resources.devices.tokenList(dev_info.id, {
    filter: { permission: "full" },
  });

  if (!dev_token.token) {
    throw `Did not receive Device token of Device with id: ${device_id}, have you correctly created the Device?`;
  }

  const device = new Device({ token: dev_token.token });

  if (!(device instanceof Device)) {
    throw "[DataResolver] Device is not an instance of TagoIO Device";
  }

  const addVariable = (variable: string) => {
    if (variables.includes(variable)) {
      return;
    }
    variables.push(variable);
  };

  const dataResolver = {
    /**
     * Data that will be added / updated in the Device.
     * @param {DataToSend} data
     * @returns this
     */
    setVariable: function (data: DataToSend) {
      if (!data.variable) {
        throw "[DataResolver] Missing variable key in data json";
      }
      addVariable(data.variable);
      newDataList.push(data);
      return this;
    },
    /**
     * Apply the changes to the device data.
     * @param {string | string[]} groups List of groups for when requesting Old Data list from the Device.
     * @returns
     */
    apply: async function (groups?: string | string[]) {
      if (!debug) {
        oldDataList = await device.getData({ variables, qty: 1, groups });
      }

      const toUpdate: DataToEdit[] = [];
      const toAdd: DataToSend[] = [];

      for (const item of newDataList) {
        const oldData = oldDataList.find((x) => x.variable === item.variable);
        if (oldData) {
          toUpdate.push({ ...item, id: oldData.id });
        } else {
          toAdd.push({
            ...item,
            group: !Array.isArray(groups) ? groups : item.group,
          });
        }
      }

      if (debug) {
        return { toAdd, toUpdate };
      }

      if (toUpdate.length > 0) {
        await device.editData(toUpdate);
      }

      if (toAdd.length > 0) {
        await device.sendData(toAdd);
      }
    },
    /**
     * Setup Old Data if you already have, avoid doing the request again.
     * @param {Data[]} dataList
     * @returns
     */
    setOldData: function (dataList: Data[]) {
      oldDataList = dataList;
      return this;
    },

    _debug: function () {
      return { variables, newDataList };
    },
  };

  return dataResolver;
}

export { DataResolver };
