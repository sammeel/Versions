import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { getClient } from "azure-devops-extension-api";
import {
  ReleaseRestClient,
  Release,
  ReleaseDefinition,
  ReleaseDefinitionExpands,
  ReleaseEnvironment,
  EnvironmentStatus,
} from "azure-devops-extension-api/Release";
import { CommonServiceIds, IProjectPageService, IHostNavigationService, INavigationElement, IPageRoute } from "azure-devops-extension-api";
import { CoreRestClient, TeamProjectReference } from "azure-devops-extension-api/Core";
import { RootState } from "../../../Common/store";
import { useAppSelector } from "../../../Common/store/hooks";
import { useEffect, useState } from "react";

export interface IGeneralInfoState {
  username?: string;
  extensionContext?: SDK.IExtensionContext;
  host?: SDK.IHostContext;
}

export interface IOverviewTabState {
  projectName?: string;
  iframeUrl?: string;
  extensionData?: string;
  navElements?: INavigationElement[];
  route?: IPageRoute;
  releaseDefinitions?: ReleaseDefinition[];
  projects?: TeamProjectReference[];
  releases: { [prop: string]: Release };
  releaseInformations?: IReleaseInformation[];
  pipelines: string[];
}

export interface IReleaseInformation {
  releaseDefinition: ReleaseDefinition;
  environments: IReleaseInformationEnvironment[];
}

export interface IReleaseInformationEnvironment {
  name: string;
  deployedRelease: ReleaseEnvironment | undefined;
  deployedReleaseName: string | undefined;
  color: string;
}

const getUsername = async (): Promise<IGeneralInfoState> => {
  await SDK.ready();

  const username = SDK.getUser().displayName;
  return {
    username: username,
    extensionContext: SDK.getExtensionContext(),
    host: SDK.getHost(),
  };
};

const getState = async (): Promise<IOverviewTabState> => {
  await SDK.ready();

  const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
  const project = await projectService.getProject();

  const resultState: IOverviewTabState = { releases: {}, pipelines: [] };

  if (project) {
    resultState.projectName = project.name;
  }

  const navService = await SDK.getService<IHostNavigationService>(CommonServiceIds.HostNavigationService);
  const navElements = await navService.getPageNavigationElements();
  resultState.navElements = navElements;

  const route = await navService.getPageRoute();
  resultState.route = route;

  const projects = await getClient(CoreRestClient).getProjects();
  resultState.projects = projects;

  if (project) {
    const expands = ReleaseDefinitionExpands.Environments;

    const releaseClient = getClient(ReleaseRestClient);

    const releaseDefinitions = await releaseClient.getReleaseDefinitions(project.id, undefined, expands);
    resultState.releaseDefinitions = releaseDefinitions;

    let releasesToFetch: number[] = [];

    releaseDefinitions.forEach((releaseDefinition) => {
      releaseDefinition.environments.forEach((environment) => {
        if (environment.currentRelease.id > 0) {
          if (releasesToFetch) releasesToFetch.push(environment.currentRelease.id);
        }
      });
    });

    const distinct = (value: any, index: number, self: any) => {
      return self.indexOf(value) === index;
    };

    releasesToFetch = releasesToFetch.filter(distinct);

    const promises = releasesToFetch.map((value) => releaseClient.getRelease(project.id, value));
    const result = await Promise.all(promises);

    const releases: { [prop: string]: Release } = {};

    result.forEach((result) => {
      releases[result.id] = result;
    });

    resultState.releases = releases;

    const releaseInformations: IReleaseInformation[] = [];

    releaseDefinitions.forEach((releaseDefinition) => {
      const releaseInformationEnvironments: IReleaseInformationEnvironment[] = [];
      releaseDefinition.environments.forEach((environment) => {
        let color = "blue";
        let releaseName = "Not Deployed";

        const release = releases[environment.currentRelease.id];
        let releaseEnvironment: ReleaseEnvironment | undefined;

        if (release === undefined) {
          color = "gray";
        } else {
          releaseEnvironment = release.environments.find((env) => env.definitionEnvironmentId === environment.id);
          if (releaseEnvironment) {
            releaseName = release.name;
            switch (releaseEnvironment.status) {
              case EnvironmentStatus.Succeeded:
                color = "green";
                break;
              case EnvironmentStatus.Canceled:
              case EnvironmentStatus.Rejected:
                color = "red";
                break;
            }
          } else {
            color = "gray";
          }
        }

        releaseInformationEnvironments.push({
          name: environment.name,
          deployedRelease: releaseEnvironment,
          color: color,
          deployedReleaseName: releaseName,
        });
      });

      releaseInformations.push({
        releaseDefinition: releaseDefinition,
        environments: releaseInformationEnvironments,
      });
    });

    resultState.releaseInformations = releaseInformations;
  }

  return resultState;
};

export function VersionsHubContent(props: any) {
  const [state, setState] = useState<IOverviewTabState>();
  const [generalState, setGeneralState] = useState<IGeneralInfoState>();
  const pipelines = useAppSelector((state: RootState) => state.versions.pipelines);

  useEffect(() => {
    const getDataWrapper = async () => {
      const response = await getUsername();
      setGeneralState(response);
    };
    getDataWrapper();
  }, []);

  useEffect(() => {
    const getDataWrapper = async () => {
      console.log("getting pipeline information", pipelines);
      const response = await getState();
      setState(response);
    };
    getDataWrapper();
  }, [pipelines]);

  return (
    <div className="page-content page-content-top flex-column rhythm-vertical-16">
      <div>{generalState?.username}</div>
      <div className="page-content page-content-top flex-column rhythm-vertical-16">
        {state?.releaseInformations &&
          state?.releaseInformations.map((information) => {
            return (
              <div key={information.releaseDefinition.id}>
                <h1>{information.releaseDefinition.name}</h1>
                <div className="badges">
                  {information.environments.map((environment, index) => {
                    return (
                      <img
                        key={index}
                        className="margin-right-16"
                        alt="Custom badge"
                        src={`https://img.shields.io/static/v1?label=${environment.name}&message=${environment.deployedReleaseName}&color=${environment.color}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}