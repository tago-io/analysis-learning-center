import { Resources } from "@tago-io/sdk";

import { ServiceParams } from "../../types";

async function getUserVariables(scope: any) {
  const user_name = scope[0]?.name;
  const user_phone = scope[0]?.["tags.phone"];

  return { user_name, user_phone };
}

async function editUser({ config_dev, scope }: ServiceParams) {
  // @ts-ignore
  const user_id = scope[0].user;
  const { id: config_dev_id } = await config_dev.info();
  // Collecting data
  const { user_name, user_phone } = await getUserVariables(scope);
  // geting user Organization tag
  const user_exists = await Resources.run.userInfo(user_id);
  const tags = user_exists.tags;
  const org_id = tags.find((tag) => tag.key === "organization_id")?.value as string;

  const new_user_info: any = {};
  if (user_name) {
    //fetching prev data
    const [user_name_config_dev] = await config_dev.getData({ variables: "user_name", qty: 1, groups: user_id });
    const [user_name_org_dev] = await org_dev.getData({ variables: "user_name", qty: 1, groups: user_id });
    //deleting prev data
    await org_dev.deleteData({ id: user_name_org_dev.id } as any);
    await config_dev.deleteData({ id: user_name_org_dev.id } as any);
    //modifying json object
    // @ts-ignore
    delete user_name_config_dev.time;
    // @ts-ignore
    delete user_name_config_dev.id;
    // @ts-ignore
    delete user_name_org_dev.time;
    // @ts-ignore
    delete user_name_org_dev.id;

    //sending new data
    await config_dev.sendData({ ...user_name_config_dev, value: user_name }).then((msg) => console.log(msg));
    await org_dev.sendData({ ...user_name_org_dev, value: user_name });

    new_user_info.name = user_name;
    await Resources.run.userEdit(user_id, new_user_info);
  }
  if (user_phone) {
    //fetching prev data
    const [user_phone_config_dev] = await config_dev.getData({ variables: "user_phone", qty: 1, groups: user_id });
    const [user_phone_org_dev] = await org_dev.getData({ variables: "user_phone", qty: 1, groups: user_id });
    //deleting prev data
    await config_dev.deleteData({ id: user_phone_config_dev.id } as any);
    await org_dev.deleteData({ id: user_phone_org_dev.id } as any);

    //modifying json object
    // @ts-ignore
    delete user_phone_config_dev.time;
    // @ts-ignore
    delete user_phone_config_dev.id;
    // @ts-ignore
    delete user_phone_org_dev.time;
    // @ts-ignore
    delete user_phone_org_dev.id;
    // @ts-ignore

    //sending new data
    await config_dev.sendData({ ...user_phone_config_dev, value: user_phone }).then((msg) => console.log(msg));
    await org_dev.sendData({ ...user_phone_org_dev, value: user_phone });

    new_user_info.phone = user_phone;
    await Resources.run.userEdit(user_id, new_user_info);
  }
  return;
}

export { editUser, getUserVariables };
