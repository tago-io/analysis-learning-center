/*
 * TagoIO (https://tago.io/)
 * TagoIO Builder V3.1.3 (https://git.io/JJ8Si)
 * -------------------
 * Generated by     :: tagoio
 * Generated at     :: Thursday, July 6, 2023 at 4:36 PM Coordinated Universal Time
 * Machine          :: fred <linux> - Node.js v18.16.0
 * Origin file      :: ./src/analysis/analysisAssetTracking.ts <TypeScript>
 * Destination file :: ./build/analysisAssetTracking.tago.js
 * -------------------
*/


// src/analysis/analysisAssetTracking.ts
var import_sdk2 = require("@tago-io/sdk");

// src/lib/edit.data.ts
var import_sdk = require("@tago-io/sdk");
function DataResolver(device_id, debug = false) {
  const variables = [];
  const newDataList = [];
  let oldDataList = [];
  const addVariable = (variable) => {
    if (variables.includes(variable)) {
      return;
    }
    variables.push(variable);
  };
  const dataResolver = {
    setVariable: function(data) {
      if (!data.variable) {
        throw "[DataResolver] Missing variable key in data json";
      }
      addVariable(data.variable);
      newDataList.push(data);
      return this;
    },
    apply: async function(groups) {
      if (oldDataList.length === 0) {
        oldDataList = await import_sdk.Resources.devices.getDeviceData(device_id, { variables, groups });
      }
      const toUpdate = [];
      const toAdd = [];
      for (const item of newDataList) {
        const oldData = oldDataList.find((x) => x.variable === item.variable && (!item.group || x.group === item.group));
        if (oldData) {
          toUpdate.push({ ...item, id: oldData.id });
        } else {
          toAdd.push({ ...item, group: !Array.isArray(groups) ? groups : item.group });
        }
      }
      if (debug) {
        return { toAdd, toUpdate };
      }
      if (toUpdate.length > 0) {
        await import_sdk.Resources.devices.editDeviceData(device_id, toUpdate);
      }
      if (toAdd.length > 0) {
        await import_sdk.Resources.devices.sendDeviceData(device_id, toAdd);
      }
      return { toAdd, toUpdate };
    },
    setOldData: function(dataList) {
      oldDataList = dataList;
      return this;
    },
    _debug: function() {
      return { variables, newDataList };
    }
  };
  return dataResolver;
}

// src/analysis/analysisAssetTracking.ts
async function updateSiteMap(vehicle_info, outdoor_data, site_id) {
  var _a;
  const vehicle_params = await import_sdk2.Resources.devices.paramList(vehicle_info.id);
  const vehicle_img = (_a = vehicle_params.find((x) => x.key === "image_urllink")) == null ? void 0 : _a.value;
  const dataResolver = DataResolver(site_id);
  dataResolver.setVariable({
    variable: "vehicle_sensor_location",
    value: vehicle_info.name,
    location: outdoor_data == null ? void 0 : outdoor_data.location,
    group: vehicle_info.id,
    metadata: {
      img_pin: vehicle_img
    }
  });
  await dataResolver.apply(vehicle_info.id);
}
async function updateHistoryData(vehicle_info, outdoor_data, site_id) {
  const sensor_history = {
    variable: "sensor_history",
    group: vehicle_info.id,
    value: vehicle_info.name,
    location: outdoor_data == null ? void 0 : outdoor_data.location
  };
  await import_sdk2.Resources.devices.sendDeviceData(site_id, sensor_history);
  await import_sdk2.Resources.devices.deleteDeviceData(site_id, { groups: [vehicle_info.id], skip: 15, variables: "sensor_history" });
}
async function assetTracker(context, scope) {
  var _a, _b, _c, _d;
  const sensor_id = (_a = scope[0]) == null ? void 0 : _a.device;
  const { tags } = await import_sdk2.Resources.devices.info(sensor_id);
  const vehicle_id = (_b = tags.find((x) => x.key === "vehicle_id")) == null ? void 0 : _b.value;
  if (!vehicle_id) {
    return console.log("Sensor is not paired with an vehicle");
  }
  const site_id = (_c = tags.find((x) => x.key === "site_id")) == null ? void 0 : _c.value;
  if (!site_id) {
    throw "Device not assigned to a Site";
  }
  const outdoor_data = scope.find((x) => x == null ? void 0 : x.location);
  if (!outdoor_data && !((_d = outdoor_data == null ? void 0 : outdoor_data.location) == null ? void 0 : _d.coordinates[0])) {
    return console.log("location data not found");
  }
  const vehicle_info = await import_sdk2.Resources.devices.info(vehicle_id);
  await updateSiteMap(vehicle_info, outdoor_data, site_id);
  await updateHistoryData(vehicle_info, outdoor_data, site_id);
}
import_sdk2.Analysis.use(assetTracker, { token: process.env.T_ANALYSIS_TOKEN });
