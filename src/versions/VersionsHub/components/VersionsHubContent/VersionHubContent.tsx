import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { getClient, IExtensionDataService, IExtensionDataManager } from "azure-devops-extension-api";
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

export interface IOverviewTabState {
  userName?: string;
  projectName?: string;
  iframeUrl?: string;
  extensionData?: string;
  extensionContext?: SDK.IExtensionContext;
  host?: SDK.IHostContext;
  navElements?: INavigationElement[];
  route?: IPageRoute;
  releaseDefinitions?: ReleaseDefinition[];
  projects?: TeamProjectReference[];
  releases: { [prop: string]: Release };
  releaseInformations?: IReleaseInformation[];
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

export class VersionsHubContent extends React.Component<{}, IOverviewTabState> {

  constructor(props: {}) {
    super(props);

    this.state = {
      iframeUrl: window.location.href,
      releases: {},
    };
  }

  public componentDidMount() {
    this.initializeState();
  }

  private async initializeState(): Promise<void> {
    await SDK.ready();

    const userName = SDK.getUser().displayName;
    this.setState({
      userName,
      extensionContext: SDK.getExtensionContext(),
      host: SDK.getHost(),
    });

    const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
    const project = await projectService.getProject();
    
    if (project) {
      this.setState({ projectName: project.name });
    }

    const navService = await SDK.getService<IHostNavigationService>(CommonServiceIds.HostNavigationService);
    const navElements = await navService.getPageNavigationElements();
    this.setState({ navElements });

    const route = await navService.getPageRoute();
    this.setState({ route });

    const projects = await getClient(CoreRestClient).getProjects();
    this.setState({ projects: projects });

    if (project) {
      const expands = ReleaseDefinitionExpands.Environments;

      const releaseClient = getClient(ReleaseRestClient);

      const releaseDefinitions = await releaseClient.getReleaseDefinitions(project.id, undefined, expands);
      this.setState({ releaseDefinitions: releaseDefinitions });

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

      this.setState({ releases: releases });

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

      this.setState({ releaseInformations: releaseInformations });
    }
  }

  public render(): JSX.Element {
    const { releaseInformations } = this.state;

    return (
      <div className="page-content page-content-top flex-column rhythm-vertical-16">
        {releaseInformations &&
          releaseInformations.map((information) => {
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
    );
  }
}
