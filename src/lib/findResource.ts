import { Resources } from "@tago-io/sdk";

async function findAnalysisByExportID(resources: Resources, export_id: string) {
  const [analysis] = await resources.analysis.list({ amount: 1, fields: ["id", "tags"], filter: { tags: [{ key: "export_id", value: export_id }] } });
  if (!analysis) {
    throw `Analysis ${export_id} not found`;
  }

  return analysis?.id;
}

async function findDashboardByExportID(resources: Resources, export_id: string) {
  const [dash] = await resources.dashboards.list({ amount: 1, fields: ["id", "tags"], filter: { tags: [{ key: "export_id", value: export_id }] } });
  if (!dash) {
    throw `Dashboard ${export_id} not found`;
  }

  return dash?.id;
}

async function findDashboardByConnectorID(resources: Resources, connector_id: string) {
  const [dash] = await resources.dashboards.list({ amount: 1, fields: ["id", "tags"], filter: { tags: [{ key: "connector_id", value: connector_id }] } });
  if (!dash) {
    throw `Dashboard ${connector_id} not found`;
  }

  return { id: dash?.id };
}

export { findDashboardByExportID, findDashboardByConnectorID, findAnalysisByExportID };
