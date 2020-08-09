import "./VersionsHub.scss";

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IHostPageLayoutService } from "azure-devops-extension-api";

import { Header, TitleSize } from "azure-devops-ui/Header";
import { IHeaderCommandBarItem } from "azure-devops-ui/HeaderCommandBar";
import { Page } from "azure-devops-ui/Page";
import { Tab, TabBar, TabSize } from "azure-devops-ui/Tabs";

import { VersionsContent } from "./VersionContent"; 
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
                    titleSize={useLargeTitle ? TitleSize.Large : TitleSize.Medium} />

                <VersionsContent />
            </Page>
        );
    }
}

showRootComponent(<VersionsHub />);