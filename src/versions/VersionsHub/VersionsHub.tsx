import "./VersionsHub.scss";

import React, { useEffect, useState } from "react";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IExtensionDataService, IHostPageLayoutService } from "azure-devops-extension-api";

import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { Page } from "azure-devops-ui/Page";

import { VersionsHubContent } from "./components/VersionsHubContent/VersionHubContent";
import { showRootComponent } from "../../Common";
import { ReleaseDefinition } from "azure-devops-extension-api/Release";

import { store } from "../Common/store";

import { Provider } from "react-redux";
import { addPipelineAsync, setPipelines as setPipelinesAction } from "../Common/store/slices/versionsReducer";
import { useAppDispatch } from "../Common/store/hooks";

interface IVersionsContentState {
  fullScreenMode: boolean;
  headerDescription?: string;
  useLargeTitle?: boolean;
  addedValue?: string;
}

const VersionsHub = (props: any) => {
  return (
    <Provider store={store}>
      <VersionsHubMain />
    </Provider>
  );
};

const VersionsHubMain = (props: any) => {
  SDK.init();
  const dispatch = useAppDispatch();

  // const panelService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);

  const getCommandBarItems = (): IHeaderCommandBarItem[] => {
    return [
      {
        id: "panel",
        text: "Add pipeline",
        onActivate: () => {
          onPanelClick();
        },
        iconProps: {
          iconName: "Add pipeline",
        },
        isPrimary: true,
        tooltipProps: {
          text: "Add a new pipeline to the view",
        },
      },
    ];
  };

  const onPanelClick = async (): Promise<void> => {
    const panelService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
    panelService.openPanel<ReleaseDefinition | undefined>(SDK.getExtensionContext().id + ".add-pipeline-panel-content", {
      title: "Add pipeline",
      description: "Add a pipeline to the view",
      onClose: (result) => {
        if (result !== undefined) {
          setPipelines([...new Set([...pipelines, result.name])]); 
          if (result) {
            dispatch(addPipelineAsync(result.name));
          }
        }
      },
    });
  };

  const getPipelines = async (): Promise<string[]> => {
    let pipelines: string[] = [];
    const accessToken = await SDK.getAccessToken();
    const extensionDataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);

    var manager = await extensionDataService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken);

    try {
      pipelines = await manager.getValue<string[]>("pipelines");
    } catch {}

    if (pipelines) return pipelines;
    return [];
  };

  const useLargeTitle = true;
  const [addedValue, setAddedValue] = useState(null);
  const [pipelines, setPipelines] = useState<string[]>([]);

  useEffect(() => {
    const getDataWrapper = async () => {
      const response = await getPipelines();
      setPipelines(response);
      dispatch(setPipelinesAction(pipelines));
    };
    getDataWrapper();
  }, []);

  return (
    <Provider store={store}>
      <Page className="sample-hub flex-grow">
        <Header
          title="Versions"
          description="description"
          commandBarItems={getCommandBarItems()}
          titleSize={useLargeTitle ? TitleSize.Large : TitleSize.Medium}
        />

        <VersionsHubContent />

        {addedValue}

        <ul>
          {pipelines.map((pipeline, index) => {
            return <li key={index}>{pipeline}</li>;
          })}
        </ul>
      </Page>
    </Provider>
  );
};

// class VersionsHub2 extends React.Component<{}, IVersionsContentState> {
//   constructor(props: {}) {
//     super(props);

//     this.state = {
//       fullScreenMode: false,
//     };
//   }

//   public async componentDidMount() {
//     SDK.init({ loaded: false });

//     await SDK.ready();

//     const accessToken = await SDK.getAccessToken();
//     const extensionDataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);

//     var manager = await extensionDataService.getExtensionDataManager(SDK.getExtensionContext().id, accessToken);

//     // await manager.deleteDocument("%24settings", "pipelines");
//     let pipelines: string[] = [];
//     try {
//       await manager.getValue<string[]>("pipelines");
//     } catch {}

//     await store.dispatch(setPipelines(pipelines));

//     console.log("pipelines", pipelines);

//     SDK.notifyLoadSucceeded();
//   }

//   public render(): JSX.Element {
//     const { headerDescription, useLargeTitle, addedValue } = this.state;

//     return (
//       <Provider store={store}>
//         <Page className="sample-hub flex-grow">
//           <Header
//             title="Versions"
//             description={headerDescription}
//             commandBarItems={this.getCommandBarItems()}
//             titleSize={useLargeTitle ? TitleSize.Large : TitleSize.Medium}
//           />

//           {/* <VersionsHubContent /> */}

//           {addedValue}
//         </Page>
//       </Provider>
//     );
//   }

//   private getCommandBarItems(): IHeaderCommandBarItem[] {
//     return [
//       {
//         id: "panel",
//         text: "Add pipeline",
//         onActivate: () => {
//           this.onPanelClick();
//         },
//         iconProps: {
//           iconName: "Add pipeline",
//         },
//         isPrimary: true,
//         tooltipProps: {
//           text: "Add a new pipeline to the view",
//         },
//       },
//     ];
//   }

//   private async onPanelClick(): Promise<void> {
//     const panelService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
//     panelService.openPanel<ReleaseDefinition | undefined>(SDK.getExtensionContext().id + ".add-pipeline-panel-content", {
//       title: "Add pipeline",
//       description: "Add a pipeline to the view",
//       // configuration: {
//       //     message: "Show header description?",
//       //     initialValue: !!this.state.headerDescription
//       // },
//       onClose: (result) => {
//         if (result !== undefined) {
//           this.setState({ addedValue: result ? result.name : undefined });
//           if (result) {
//             // const dispatch = useAppDispatch();
//             // dispatch(addPipeline(result.name));
//           }
//         }
//       },
//     });
//   }
// }

showRootComponent(<VersionsHub />);
