import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import { Dropdown } from "azure-devops-ui/Dropdown";
import { Button } from "azure-devops-ui/Button";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { getClient, IProjectPageService, CommonServiceIds } from "azure-devops-extension-api";
import { ReleaseRestClient, ReleaseDefinition, Release } from "azure-devops-extension-api/Release";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { useEffect, useState } from "react";
import { addPipeline, addPipelineAsync } from "../../Common/store/slices/versionsReducer";
import { useAppDispatch } from "../../Common/store/hooks";

const getReleaseDefinitions = async (): Promise<IListBoxItem<ReleaseDefinition>[] | null> => {
  SDK.init();

  const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
  const project = await projectService.getProject();

  if (project) {
    const releaseClient = getClient(ReleaseRestClient);

    const releaseDefinitions = await releaseClient.getReleaseDefinitions(project.id);
    return releaseDefinitions.map((def) => {
      return { id: `${def.id}`, text: def.name, data: def } as IListBoxItem<ReleaseDefinition>;
    });
  }

  return null;
};

export const AddPipelinePanelContent = () => {
  const [releaseDefinitions, setReleaseDefinitions] = useState<IListBoxItem<ReleaseDefinition>[]>([]);
  const [selectedReleaseDefinition, setSelectedReleaseDefinition] = useState<ReleaseDefinition | undefined>(undefined);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const getDataWrapper = async () => {
      const response = await getReleaseDefinitions();
      if (response) {
        setReleaseDefinitions(response);
      } else {
        setReleaseDefinitions([]);
      }
    };

    getDataWrapper();
  }, []);

  const onSelect = (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<ReleaseDefinition>) => {
    setSelectedReleaseDefinition(item.data);
  };

  const okClicked = () => {
    dismiss(true);
    if (selectedReleaseDefinition?.name) {
      dispatch(addPipelineAsync(selectedReleaseDefinition?.name));
      dispatch(addPipeline(selectedReleaseDefinition?.name));
    }
  };

  const dismiss = (useValue: boolean) => {
    const result = useValue ? selectedReleaseDefinition : undefined;
    const config = SDK.getConfiguration();
    if (config.dialog) {
      config.dialog.close(result);
    } else if (config.panel) {
      config.panel.close(result);
    }
  };

  return (
    <div className="sample-panel flex-column flex-grow">
      <Dropdown items={releaseDefinitions} placeholder="Select a release pipeline" onSelect={onSelect}></Dropdown>
      <ButtonGroup className="sample-panel-button-bar">
        <Button primary={true} text="OK" onClick={() => okClicked()} />
        <Button text="Cancel" onClick={() => dismiss(false)} />
      </ButtonGroup>

      {selectedReleaseDefinition?.name}
    </div>
  );
};

// interface IPanelContentState {
//   message?: string;
//   toggleValue?: boolean;
//   ready?: boolean;
//   releaseDefinitionOptions: IListBoxItem<ReleaseDefinition>[];
//   selectedReleaseDefinition?: ReleaseDefinition;
// }

// class PanelContent extends React.Component<{}, IPanelContentState> {
//   constructor(props: {}) {
//     super(props);
//     this.state = {
//       releaseDefinitionOptions: [],
//     };
//   }

//   public async componentDidMount() {
//     SDK.init();

//     const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
//     const project = await projectService.getProject();

//     if (project) {
//       const releaseClient = getClient(ReleaseRestClient);

//       const releaseDefinitions = await releaseClient.getReleaseDefinitions(project.id);
//       this.setState({
//         releaseDefinitionOptions: releaseDefinitions.map((def) => {
//           return { id: `${def.id}`, text: def.name, data: def } as IListBoxItem<ReleaseDefinition>;
//         }),
//       });
//     }

//     SDK.ready().then(() => {
//       const config = SDK.getConfiguration();
//       const message = config.message || "Custom dialog message";
//       const toggleValue = !!config.initialValue;
//       this.setState({ message, toggleValue, ready: true });

//       if (config.dialog) {
//         // Give the host frame the size of our dialog content so that the dialog can be sized appropriately.
//         // This is the case where we know our content size and can explicitly provide it to SDK.resize. If our
//         // size is dynamic, we have to make sure our frame is visible before calling SDK.resize() with no arguments.
//         // In that case, we would instead do something like this:
//         //
//         // SDK.notifyLoadSucceeded().then(() => {
//         //    // we are visible in this callback.
//         //    SDK.resize();
//         // });
//         SDK.resize(400, 400);
//       }
//     });
//   }

//   public render(): JSX.Element {
//     const { message, ready, toggleValue, releaseDefinitionOptions, selectedReleaseDefinition } = this.state;

//     let selected;
//     if (selectedReleaseDefinition) {
//       selected = selectedReleaseDefinition.name;
//     }

//     return (
//       <div className="sample-panel flex-column flex-grow">
//         <Dropdown items={releaseDefinitionOptions} placeholder="Select a release pipeline" onSelect={this.onSelect}></Dropdown>
//         <ButtonGroup className="sample-panel-button-bar">
//           <Button primary={true} text="OK" onClick={() => this.dismiss(true)} />
//           <Button text="Cancel" onClick={() => this.dismiss(false)} />
//         </ButtonGroup>

//         {selected}
//       </div>
//     );
//   }

//   private dismiss(useValue: boolean) {
//     const result = useValue ? this.state.selectedReleaseDefinition : undefined;
//     const config = SDK.getConfiguration();
//     if (config.dialog) {
//       config.dialog.close(result);
//     } else if (config.panel) {
//       config.panel.close(result);
//     }
//   }

//   private onSelect = (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<ReleaseDefinition>) => {
//     this.setState({ selectedReleaseDefinition: item.data });
//   };
// }
