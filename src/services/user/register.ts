import { Resources } from "@tago-io/sdk";
import { Data } from "@tago-io/sdk/src/common/common.types";

import { inviteUser } from "../../lib/registerUser";
import validation from "../../lib/validation";
import { ServiceParams } from "../../types";

async function getNewUserVariables(scope: Data[]) {
  const new_user_name = scope.find((x) => x.variable === "new_user_name");
  const new_user_email = scope.find((x) => x.variable === "new_user_email");
  const new_user_phone = scope.find((x) => x.variable === "new_user_phone");
  const new_user_access = scope.find((x) => x.variable === "new_user_access");
  const new_user_site = scope.find((x) => x.variable === "new_user_site");

  return { new_user_name, new_user_email, new_user_phone, new_user_access, new_user_site } as any;
}

async function createUser({ context, scope }: ServiceParams) {
  const org_id = scope[0].device;
  const validate = await validation("user_validation", org_id);
  await validate("Registering...", "warning");
  const { new_user_name, new_user_email, new_user_site, new_user_access, new_user_phone } = await getNewUserVariables(scope);

  const [user_exists] = await Resources.run.listUsers({
    page: 1,
    amount: 1,
    filter: { email: new_user_email.value },
  });
  if (user_exists) {
    return await validate("User already exists!", "danger");
  }

  const new_user_data = {
    name: new_user_name.value,
    email: new_user_email.value,
    phone: new_user_phone.value,
    site: new_user_site === undefined ? "" : new_user_site?.metadata.name,
    timezone: "America/New_York",
    tags: [
      {
        key: "organization_id",
        value: org_id,
      },
      {
        key: "site_id",
        value: new_user_site === undefined ? "" : new_user_site?.value,
      },
      {
        key: "access",
        value: new_user_access.value,
      },
      {
        key: "phone",
        value: new_user_phone.value,
      },
      {
        key: "email",
        value: new_user_email.value,
      },
    ],
  };

  await inviteUser(context, new_user_data, "rtls.tago.run/");
  context.log("Analysis Finished");
  return await validate("User successfully invited! An email will be sent with the credentials to the new user.", "success");
}

export { createUser };
