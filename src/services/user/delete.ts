import { Resources } from "@tago-io/sdk";

import { ServiceParams } from "../../types";

/**
 * @Description Deletes the selected user
 */
async function deleteUser({ scope, environment }: ServiceParams) {
  // @ts-ignore
  const user_id = scope[0].user;
  // checking if user exists
  const user_exists = await Resources.run.userInfo(user_id);

  if (!user_exists) {
    throw "User does not exist";
  }

  if (environment._user_id === user_id) {
    throw "User tried to delete himself";
  }

  await Resources.run.userDelete(user_id);
  return;
}

export { deleteUser };
