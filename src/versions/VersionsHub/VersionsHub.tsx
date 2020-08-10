import "./VersionsHub.scss";

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IHostPageLayoutService } from "azure-devops-extension-api";

import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { Page } from "azure-devops-ui/Page";

import { VersionsHubContent } from "./components/VersionsHubContext/VersionHubContent"; 
import { showRootComponent } from "../../Common";

interface IVersionsContentState {
    fullScreenMode: boolean;
    headerDescription?: string;
    useLargeTitle?: boolean;
}

class VersionsHub extends React.Component<{}, IVersionsContentState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            fullScreenMode: false
        };
    }

    public componentDidMount() {
        SDK.init();
    }

    public render(): JSX.Element {

        const { headerDescription, useLargeTitle } = this.state;

        return (
            <Page className="sample-hub flex-grow">

                <Header title="Versions"
                    description={headerDescription}
                    commandBarItems={this.getCommandBarItems()}
                    titleSize={useLargeTitle ? TitleSize.Large : TitleSize.Medium} />

                <VersionsHubContent />
            </Page>
        );
    }

    private getCommandBarItems(): IHeaderCommandBarItem[] {
        return [
            {
              id: "panel",
              text: "Add pipeline",
              onActivate: () => { this.onPanelClick() },
              iconProps: {
                iconName: 'Add pipeline'
              },
              isPrimary: true,
              tooltipProps: {
                text: "Add a new pipeline to the view"
              }
            },
        ];
    }

    private async onPanelClick(): Promise<void> {
        const panelService = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
        panelService.openPanel<boolean | undefined>(SDK.getExtensionContext().id + ".add-pipeline-panel-content", {
            title: "Add pipeline",
            description: "Add a pipeline to the view",
            // configuration: {
            //     message: "Show header description?",
            //     initialValue: !!this.state.headerDescription
            // },
            onClose: (result) => {
                if (result !== undefined) {
                    this.setState({ headerDescription: result ? "This is a header description" : undefined });
                }
            }
        });
    }
}

showRootComponent(<VersionsHub />);