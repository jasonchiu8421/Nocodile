import * as React from 'react';
import { useEffect } from 'react';
import { FileManagerComponent, Inject, NavigationPane, Toolbar } from '@syncfusion/ej2-react-filemanager';
/**
 * File Manager API sample
 */
const Default = () => {
    let hostUrl = "https://ej2-aspcore-service.azurewebsites.net/";
    return (<div>
            <div className="control-section">
                <FileManagerComponent id="api_filemanager" ajaxSettings={{
            downloadUrl: hostUrl + 'api/FileManagerAccess/Download',
            getImageUrl: hostUrl + 'api/FileManagerAccess/GetImage',
            uploadUrl: hostUrl + 'api/FileManagerAccess/Upload',
            url: hostUrl + 'api/FileManagerAccess/FileOperations'
        }} toolbarSettings={{ items: ['NewFolder', 'SortBy', 'Cut', 'Copy', 'Paste', 'Delete', 'Refresh', 'Download', 'Rename', 'Selection', 'View', 'Details'] }} contextMenuSettings={{
            file: ['Cut', 'Copy', '|', 'Delete', 'Download', 'Rename', '|', 'Details'],
            layout: ['SortBy', 'View', 'Refresh', '|', 'Paste', '|', 'NewFolder', '|', 'Details', '|', 'SelectAll'],
            visible: true
        }}>
                    <Inject services={[NavigationPane, Toolbar]}/>
                </FileManagerComponent>
            </div>
        </div>);
};
export default Default;

// control over who can access your folders and files