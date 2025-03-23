import * as React from 'react';
import { useEffect } from "react";
import { FileManagerComponent, Inject, NavigationPane, DetailsView, Toolbar } from '@syncfusion/ej2-react-filemanager';
/**
 * File Manager Drag and Drop feature sample
 */
const DragAndDrop = () => {
    let hostUrl = "https://ej2-aspcore-service.azurewebsites.net/";
    return (<div>
            <div className="control-section">
                <FileManagerComponent id="filemanager" ajaxSettings={{ url: hostUrl + "api/FileManager/FileOperations", getImageUrl: hostUrl + "api/FileManager/GetImage", uploadUrl: hostUrl + 'api/FileManager/Upload', downloadUrl: hostUrl + 'api/FileManager/Download' }} toolbarSettings={{ items: ['NewFolder', 'SortBy', 'Cut', 'Copy', 'Paste', 'Delete', 'Refresh', 'Download', 'Rename', 'Selection', 'View', 'Details'] }} contextMenuSettings={{ file: ['Cut', 'Copy', '|', 'Delete', 'Download', 'Rename', '|', 'Details'], layout: ['SortBy', 'View', 'Refresh', '|', 'Paste', '|', 'NewFolder', '|', 'Details', '|', 'SelectAll'], visible: true }} allowDragAndDrop={true}>
                    <Inject services={[NavigationPane, DetailsView, Toolbar]}/>
                </FileManagerComponent>
            </div>
        </div>);
};
export default DragAndDrop;

// drag-and-drop feature
