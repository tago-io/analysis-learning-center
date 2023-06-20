import { Data } from "@tago-io/sdk/src/common/common.types";

import validation from "../../lib/validation";
import { ServiceParams } from "../../types";

function getOrgVariables(scope: Data[]) {
  const name = scope.find((x) => x.variable === "org_name")?.value as string;
  const address = scope.find((x) => x.variable === "org_address") as Data;

  return { name, address };
}

async function editOrganization({ config_dev, scope }: ServiceParams) {
  const org_id = scope[0].device;
  const validate = validation("org_validation", config_dev);
  await validate("Editing...", "warning");
  const { name: org_name, address: org_address } = await getOrgVariables(scope);

  if (org_name) {
    const [org_id_data] = await config_dev.getData({
      variables: "org_name",
      qty: 1,
      groups: org_id,
    });

    await config_dev.editData({
      ...org_id_data,
      metadata: { ...org_id_data.metadata, label: org_name },
      value: org_name,
    });
  }

  if (org_address) {
    const [org_id_data] = await config_dev.getData({
      variables: "org_address",
      qty: 1,
      groups: org_id,
    });

    await config_dev.editData({
      ...org_id_data,
      metadata: { ...org_id_data.metadata, label: org_address.value as string },
      location: org_address.location,
      value: org_address.value,
    });
  }

  return await validate("Organization edited", "success");
}

export { editOrganization };
