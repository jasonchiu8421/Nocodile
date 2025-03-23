import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { UploaderComponent } from '@syncfusion/ej2-react-inputs';
import { DialogComponent } from '@syncfusion/ej2-react-popups';
import { ButtonComponent } from '@syncfusion/ej2-react-buttons';
import { FileManagerComponent, Inject, NavigationPane, DetailsView, Toolbar } from '@syncfusion/ej2-react-filemanager';
import './file-upload.css';
/**
 * File Manager real time use case sample
 */
const FileUpload = () => {
    const [display, setDisplay] = useState('block');
    const [file, setFile] = useState([{
            name: "",
            size: null,
            type: ""
        }]);
    const [path, setPath] = useState('/');
    const [selectedItem, setSelectedItem] = useState([]);
    let fileUploadObj = useRef(null);
    let dialogObj = useRef(null);
    let filemanagerObj = useRef(null);
    let animationSettings = { effect: 'None' };
    // 'Uploader' will be shown, if Dialog is closed
    const dialogClose = () => {
        setDisplay('block');
    };
    // 'Uploader' will be hidden, if Dialog is opened
    const dialogOpen = () => {
        setDisplay('none');
    };
    // File Manager's fileOpen event function
    const onFileOpen = (args) => {
        let file = args.fileDetails;
        if (file.isFile) {
            args.cancel = true;
            if (file.size <= 0) {
                file.size = 10000;
            }
            setFile([{ name: file.name, size: file.size, type: file.type }]);
            dialogObj.current.hide();
        }
    };
    const btnClick = () => {
        dialogObj.current.show();
        dialogOpen();
        setPath('/');
        setSelectedItem([]);
        filemanagerObj.current.refresh();
    };
    let hostUrl = "https://ej2-aspcore-service.azurewebsites.net/";
    return (<div>
            <div className="control-section">
                <div id='uploadFileManager' className="fileupload" style={{ display: display }}>
                    <UploaderComponent id='fileUpload' type='file' ref={fileUploadObj} files={file}></UploaderComponent>
                    <ButtonComponent id="openBtn" onClick={btnClick.bind(this)}>File Browser</ButtonComponent>
                </div>
                <div id='target' className="control-section">
                    <DialogComponent width='850px' id='dialog' target={'#target'} ref={dialogObj} header="Select a file" showCloseIcon={true} visible={false} open={dialogOpen.bind(this)} close={dialogClose.bind(this)} animationSettings={animationSettings}>
                        <FileManagerComponent id="filemanager" ref={filemanagerObj} path={path} selectedItems={selectedItem} ajaxSettings={{ url: hostUrl + "api/FileManager/FileOperations", getImageUrl: hostUrl + "api/FileManager/GetImage", uploadUrl: hostUrl + 'api/FileManager/Upload', downloadUrl: hostUrl + 'api/FileManager/Download' }} allowMultiSelection={false} toolbarSettings={{ items: ['NewFolder', 'Upload', 'Delete', 'Cut', 'Copy', 'Rename', 'SortBy', 'Refresh', 'Selection', 'View', 'Details'] }} contextMenuSettings={{ file: ['Cut', 'Copy', '|', 'Delete', 'Download', 'Rename', '|', 'Details'], layout: ['SortBy', 'View', 'Refresh', '|', 'Paste', '|', 'NewFolder', '|', 'Details', '|', 'SelectAll'], visible: true }} fileOpen={onFileOpen.bind(this)}>
                            <Inject services={[NavigationPane, DetailsView, Toolbar]}/>
                        </FileManagerComponent>
                    </DialogComponent>
                </div>
            </div>
        </div>);
};
export default FileUpload;

// demonstrates the real-time use case of File Manager in a web application