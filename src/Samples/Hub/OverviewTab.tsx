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

export class OverviewTab extends React.Component<{}, IOverviewTabState> {
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
    console.log("project", project);
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
    const {
      userName,
      projectName,
      host,
      iframeUrl,
      extensionContext,
      route,
      navElements,
      releaseDefinitions: releaseDefinitions,
      releases,
      releaseInformations,
    } = this.state;

    const containerStyle = { height: "300px", width: "800px", display: "flex" };

    var imgStyle: React.CSSProperties = {
      marginRight: "15px",
    };

    return (
      <div className="page-content page-content-top flex-column rhythm-vertical-16">
        <div>
          test badge:
          <img alt="Custom badge" src="https://img.shields.io/static/v1?label=myLabel&message=myMessage&color=blue"></img>
        </div>
        <div>test releases</div>
        a: {releaseInformations == null}
        {releaseInformations &&
          releaseInformations.map((information) => {
            return (
              <div key={information.releaseDefinition.id}>
                <h1>Release Definition: {information.releaseDefinition.name}</h1>
                <div className="badges">
                  {information.environments.map((environment, index) => {
                    return (
                      <img
                        style={imgStyle}
                        key={index}
                        alt="Custom badge"
                        src={`https://img.shields.io/static/v1?label=${environment.name}&message=${environment.deployedReleaseName}&color=${environment.color}`}
                        // src={`https://img.shields.io/static/v1?label=${environment.name}&message=${
                        //   environment.deployedRelease?.name ?? "not deployed"
                        // }&color=${environment.color}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        {/* {releaseDefinitions &&
          releaseDefinitions.map((definition) => {
            return <div key={definition.id}>{definition.name}</div>;
          })} */}
        <div>Hello, {userName}!</div>
        {projectName && <div>Project: {projectName}</div>}
        <div>iframe URL: {iframeUrl}</div>
        {extensionContext && (
          <div>
            <div>Extension id: {extensionContext.id}</div>
            <div>Extension version: {extensionContext.version}</div>
          </div>
        )}
        {host && (
          <div>
            <div>Host id: {host.id}</div>
            <div>Host name: {host.name}</div>
            <div>Host service version: {host.serviceVersion}</div>
          </div>
        )}
        {navElements && <div>Nav elements: {JSON.stringify(navElements)}</div>}
        {route && <div>Route: {JSON.stringify(route)}</div>}
      </div>
    );
  }
}
