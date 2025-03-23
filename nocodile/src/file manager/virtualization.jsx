import * as React from 'react';
import { useEffect } from 'react';
import { FileManagerComponent, Inject, NavigationPane, DetailsView, Toolbar, Virtualization } from '@syncfusion/ej2-react-filemanager';
/**
 * File Manager virtualization feature sample
 */
const VirtualizationSample = () => {
    let hostUrl = "https://ej2-aspcore-service.azurewebsites.net/";
    const onBeforeSend = (args) => {
        args.ajaxSettings.beforeSend = (args) => {
            args.httpRequest.setRequestHeader('Authorization', 'FileBrowser');
        };
    };
    const beforeImageLoad = (args) => {
        args.imageUrl = args.imageUrl + '&rootName=' + 'FileBrowser';
    };
    const beforeDownload = (args) => {
        args.data.rootFolderName = 'FileBrowser';
    };
    return (<div>
            <div className="control-section">
                <FileManagerComponent id="filemanager" ajaxSettings={{ url: hostUrl + "api/Virtualization/FileOperations", getImageUrl: hostUrl + "api/Virtualization/GetImage", uploadUrl: hostUrl + 'api/Virtualization/Upload', downloadUrl: hostUrl + 'api/Virtualization/Download' }} toolbarSettings={{ items: ['NewFolder', 'SortBy', 'Cut', 'Copy', 'Paste', 'Delete', 'Refresh', 'Download', 'Rename', 'View', 'Details'] }} contextMenuSettings={{ file: ['Cut', 'Copy', '|', 'Delete', 'Download', 'Rename', '|', 'Details'], layout: ['SortBy', 'View', 'Refresh', '|', 'Paste', '|', 'NewFolder', '|', 'Details', '|', 'SelectAll'], visible: true }} view={"Details"} enableVirtualization={true} beforeSend={onBeforeSend.bind(this)} beforeImageLoad={beforeImageLoad.bind(this)} beforeDownload={beforeDownload.bind(this)}>
                    <Inject services={[NavigationPane, DetailsView, Toolbar, Virtualization]}/>
                </FileManagerComponent>
            </div>
        </div>);
};
export default VirtualizationSample;

// https://ej2.syncfusion.com/react/demos/?_gl=1*k4fa0o*_ga*NjUwODcxODY3LjE3NDI2OTQ4OTA.*_ga_41J4HFMX1J*MTc0MjY5NDg5MC4xLjEuMTc0MjY5NTE3OC4wLjAuMA..#/bootstrap5/file-manager/virtualization
// Implementation of UI virtualization within the File Manager component, enhancing performance and user experience by dynamically
// loading folders and files as the user scrolls through the items. In both the details view and large icons view, the component
// efficiently handles extensive data sets, ensuring smooth navigation.