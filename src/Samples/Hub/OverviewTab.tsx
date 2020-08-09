import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { getClient } from "azure-devops-extension-api";
import { ReleaseRestClient, Release } from "azure-devops-extension-api/Release";
import {
  CommonServiceIds,
  IProjectPageService,
  IHostNavigationService,
  INavigationElement,
  IPageRoute,
} from "azure-devops-extension-api";
import {
  CoreRestClient,
  TeamProjectReference,
} from "azure-devops-extension-api/Core";

export interface IOverviewTabState {
  userName?: string;
  projectName?: string;
  iframeUrl?: string;
  extensionData?: string;
  extensionContext?: SDK.IExtensionContext;
  host?: SDK.IHostContext;
  navElements?: INavigationElement[];
  route?: IPageRoute;
  releases?: Release[];
  projects?: TeamProjectReference[];
}

export class OverviewTab extends React.Component<{}, IOverviewTabState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      iframeUrl: window.location.href,
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

    const projectService = await SDK.getService<IProjectPageService>(
      CommonServiceIds.ProjectPageService
    );
    const project = await projectService.getProject();
    console.log("project", project);
    if (project) {
      this.setState({ projectName: project.name });
    }

    const navService = await SDK.getService<IHostNavigationService>(
      CommonServiceIds.HostNavigationService
    );
    const navElements = await navService.getPageNavigationElements();
    this.setState({ navElements });

    const route = await navService.getPageRoute();
    this.setState({ route });

    const projects = await getClient(CoreRestClient).getProjects();
    this.setState({ projects: projects });

    if (project) {
      const releases = await getClient(ReleaseRestClient).getReleases(
        project.id
      );
      this.setState({ releases: releases });
      console.log("releases", releases);
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
      releases,
      projects,
    } = this.state;

    return (
      <div className="page-content page-content-top flex-column rhythm-vertical-16">
        <div>
          test badge:
          <img
            alt="Custom badge"
            src="https://img.shields.io/static/v1?label=myLabel&message=myMessage&color=blue"
          ></img>
        </div>

        <div>test releases</div>
        {releases &&
          releases.map((release) => {
            return <div key={release.id}>{release.name}</div>;
          })}

        <div>test projects</div>
        {projects &&
          projects.map((project) => {
            return <div key={project.id}> -- {project.name}</div>;
          })}
        <hr />

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
