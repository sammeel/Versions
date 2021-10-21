import { CommonServiceIds, IExtensionDataService, IProjectPageService } from "azure-devops-extension-api";
import * as SDK from "azure-devops-extension-sdk";

const getPipelineConfigKey = async (): Promise<string> => {
  const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
  const project = await projectService.getProject();

  return `${project?.id}-pipelines`;
};

export const getPipelineConfig = async (): Promise<number[]> => {
  const accessToken = await SDK.getAccessToken();
  const extensionDataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);

  const key = await getPipelineConfigKey();

  const manager = await extensionDataService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken);

  return await manager.getValue<number[]>(key, { defaultValue: [], scopeType: "User" });
};

export const setPipelineConfig = async (pipelines: number[]) => {
  const accessToken = await SDK.getAccessToken();
  const extensionDataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);

  const key = await getPipelineConfigKey();

  const manager = await extensionDataService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken);

  await manager.setValue<number[]>(key, pipelines, { scopeType: "User" });
};
