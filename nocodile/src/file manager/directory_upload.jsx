import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { FileManagerComponent, Inject, NavigationPane, DetailsView, Toolbar, ToolbarItemsDirective, ToolbarItemDirective } from '@syncfusion/ej2-react-filemanager';
import { DropDownButtonComponent } from '@syncfusion/ej2-react-splitbuttons';
/**
 * File Manager folder upload sample
 */
const DirectoryUpload = () => {
    const [isDirectoryUpload, setIsDirectoryUpload] = useState(false);
    let fmObj = useRef(null);
    let hostUrl = "https://ej2-aspcore-service.azurewebsites.net/";
    let items = [{ text: 'Folder' }, { text: 'Files' }];
    const onSelect = (args) => {
        if (args.item.text === "Folder") {
            setIsDirectoryUpload(true);
        }
        else {
            setIsDirectoryUpload(false);
        }
        setTimeout(() => {
            let uploadBtn = document.querySelector('.e-file-select-wrap button');
            uploadBtn.click();
        }, 100);
    };
    const uploadClick = (e) => {
        e.stopPropagation();
    };
    const uploadTemplate = () => {
        return (<DropDownButtonComponent id="dropButton" cssClass="e-tbar-btn e-tbtn-txt" onClick={uploadClick} items={items} iconCss='e-icons e-fe-upload' select={onSelect}>
                <span className="e-tbar-btn-text">Upload</span>
            </DropDownButtonComponent>);
    };
    return (<div>
            <div className="control-section">
                <FileManagerComponent id="file" ref={fmObj} uploadSettings={{ directoryUpload: isDirectoryUpload }} ajaxSettings={{ url: hostUrl + "api/FileManager/FileOperations", getImageUrl: hostUrl + "api/FileManager/GetImage", uploadUrl: hostUrl + 'api/FileManager/Upload', downloadUrl: hostUrl + 'api/FileManager/Download' }} contextMenuSettings={{
            file: ['Cut', 'Copy', '|', 'Delete', 'Download', 'Rename', '|', 'Details'],
            visible: true
        }}>
                    <ToolbarItemsDirective>
                            <ToolbarItemDirective name='NewFolder'/>
                            <ToolbarItemDirective template={uploadTemplate} name="Upload"/>
                            <ToolbarItemDirective name="SortBy"/>
                            <ToolbarItemDirective name="Refresh"/>
                            <ToolbarItemDirective name="Cut"/>
                            <ToolbarItemDirective name="Copy"/>
                            <ToolbarItemDirective name="Paste"/>
                            <ToolbarItemDirective name="Delete"/>
                            <ToolbarItemDirective name="Download"/>
                            <ToolbarItemDirective name="Rename"/>
                            <ToolbarItemDirective name="Selection"/>
                            <ToolbarItemDirective name="View"/>
                            <ToolbarItemDirective name="Details"/>
                        </ToolbarItemsDirective>
                    <Inject services={[NavigationPane, DetailsView, Toolbar]}/>
                </FileManagerComponent>
            </div>
        </div>);
};
export default DirectoryUpload;

// folder (directory) upload feature
// https://ej2.syncfusion.com/react/demos/?_gl=1*k4fa0o*_ga*NjUwODcxODY3LjE3NDI2OTQ4OTA.*_ga_41J4HFMX1J*MTc0MjY5NDg5MC4xLjEuMTc0MjY5NTE3OC4wLjAuMA..#/bootstrap5/file-manager/directory-upload