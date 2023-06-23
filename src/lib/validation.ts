import { DateTime } from "luxon";

import { Device, Resources } from "@tago-io/sdk";

type validation_type = "success" | "danger" | "warning" | string;
interface IValidateOptions {
  show_markdown?: boolean;
  user_id?: string;
}

/**
 * Setup function to send validation data to widgets.
 *
 * @returns a new function to be used to send the actual validation message.
 * @param validation_var variable of the validation in the widget
 * @param device_id device id associated to the variable in the widget
 * @param show_markdown enable/disable markdown
 */
export default async function validation(
  validation_var: string,
  device_id: string,
  opts?: IValidateOptions
) {
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

  let i = 0;
  return async function _(message: string, type: validation_type) {
    if (!message || !type) {
      throw "Missing message or type";
    }

    i += 1;
    // clean the bucket
    await device
      .deleteData({
        variables: validation_var,
        qty: 999,
        end_date: DateTime.now().minus({ minutes: 1 }).toJSDate(),
      })
      .catch(console.error);

    await device
      .sendData({
        variable: validation_var,
        value: message,
        time: DateTime.now()
          .plus({ milliseconds: i * 200 })
          .toJSDate(), //increment time by i
        metadata: {
          type: ["success", "danger", "warning"].includes(type) ? type : null,
          color: !["success", "danger", "warning"].includes(type)
            ? type
            : undefined,
          show_markdown: !!opts?.show_markdown,
          user_id: opts?.user_id,
        },
      })
      .catch(console.error);

    return message;
  };
}
