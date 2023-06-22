import { convertLocationParamToObj } from "../../lib/fix-address";
import { ServiceParams } from "../../types";

function getOrgVariables(scope: any) {
  const name = scope[0]?.name;
  const edit_address = scope[0]?.["param.address"];
  const new_address = convertLocationParamToObj(edit_address);
  const address = {
    value: new_address?.value,
    location: new_address?.location,
  } as any;
  return { name, address };
}

async function editOrganization({ config_dev, scope }: ServiceParams) {
  const org_id = scope[0].device;
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
      metadata: { ...org_id_data.metadata, label: org_address.value },
      location: org_address.location,
      value: org_address.value,
    });
  }
}

export { editOrganization };
