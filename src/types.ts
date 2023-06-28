// ? ==================================== (c) TagoIO ====================================
// ? What is this file?
// * This file is global types, it's used to remove "implicitly has an 'any' type" errors.
// ? ====================================================================================

import { Device } from "@tago-io/sdk";
import { TagoContext } from "@tago-io/sdk/lib/types";
import { Data } from "@tago-io/sdk/src/common/common.types";
import { RouterConstructor } from "@tago-io/sdk/src/modules/Utils/router/router.types";

interface ServiceParams {
  context: TagoContext;
  config_dev: Device;
  notification: any;
  environment: any;
  scope: Data[];
}

interface RouterConstructorCustomBtn extends Omit<RouterConstructor, "scope"> {
  scope: {
    device: string;
    displayValue: string;
    property: string;
    value: string;
  }[];
  context: TagoContext;
}

export { RouterConstructorCustomBtn, ServiceParams, TagoContext };
