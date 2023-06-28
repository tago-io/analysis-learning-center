import { Resources } from "@tago-io/sdk";

import { ServiceParams } from "../../types";

async function deleteUser({ scope, environment, context }: ServiceParams) {
  // @ts-ignore
  const user_id = scope[0].user;
  // checking if user exists
  const user_exists = await Resources.run.userInfo(user_id);

  const tags = user_exists.tags;
  const org_id = tags.find((tag) => tag.key === "organization_id")?.value;
  if (!org_id) {
    throw "Organization ID not found";
  }

  if (!user_exists) {
    throw "User does not exist";
  }

  if (environment._user_id === user_id) {
    throw "User tried to delete himself";
  }

  await Resources.run.userDelete(user_id);
  context.log("Analysis Finished");
  return;
}

export { deleteUser };
