import * as React from 'react';
import { useEffect } from "react";
import { FileManagerComponent, Inject, NavigationPane, DetailsView, Toolbar } from '@syncfusion/ej2-react-filemanager';
/**
 * File Manager full functionalities sample
 */
const Overview = () => {
    let hostUrl = "https://ej2-aspcore-service.azurewebsites.net/";
    return (<div>
            <div className="control-section">
                <FileManagerComponent id="overview_file" ajaxSettings={{ url: hostUrl + "api/FileManager/FileOperations", getImageUrl: hostUrl + "api/FileManager/GetImage", uploadUrl: hostUrl + 'api/FileManager/Upload', downloadUrl: hostUrl + 'api/FileManager/Download' }} toolbarSettings={{ items: ['NewFolder', 'SortBy', 'Cut', 'Copy', 'Paste', 'Delete', 'Refresh', 'Download', 'Rename', 'Selection', 'View', 'Details'] }} contextMenuSettings={{ file: ['Cut', 'Copy', '|', 'Delete', 'Download', 'Rename', '|', 'Details'], layout: ['SortBy', 'View', 'Refresh', '|', 'Paste', '|', 'NewFolder', '|', 'Details', '|', 'SelectAll'], visible: true }} view={"Details"}>
                    <Inject services={[NavigationPane, DetailsView, Toolbar]}/>
                </FileManagerComponent>
            </div>
        </div>);
};
export default Overview;