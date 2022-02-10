import {useEffect, useState} from 'react';

const fs = window.require('fs/promises');
const path = window.require('path');

function useLibrary(libraryFolder) {

    const [libraryContents, setLibraryContents] = useState([]);

    const validFormats = [".mp3", ".mpg", ".mpeg", ".opus", ".ogg", ".oga", ".wav", 
        ".aac", ".caf", ".m4a", ".mp4", ".weba", ".webm", ".dolby", ".flac"];

    useEffect(() => {
        if (libraryFolder) {
            let directoryList = fs.readdir(libraryFolder, {withFileTypes: true})
            .then(allEntries => allEntries.filter(file => file.isDirectory()).map(file => file.name)) //Get all primary folders in library
            .then(allDirectories => getAllFileLists(allDirectories)) //Get all files in each library folder
            .then(allFiles => allFiles.filter(obj => obj !== null)) //Remove any empty folders
            .then(filteredFiles => setLibraryContents(filteredFiles))
        }
    }, [libraryFolder]);


    async function getAllFileLists(folders) {

        let folderFileObjArray = await Promise.all(folders.map(async folder => 
            {
                let fileArray = await getFileList(folder);
                if (fileArray.length) {
                    return ({folderName: folder,
                        files: fileArray});
                } 
                else {return null;}
            }
        ))
        return folderFileObjArray;
    }


    async function getFileList(folder) {

        let fileList = fs.readdir(path.join(libraryFolder, folder), {withFileTypes: true})
            .then(allEntries => allEntries.filter(file => file.isFile()).map(file => file.name)) //Use only files, not directories
            .then(onlyFiles => onlyFiles.filter(file => validFormats.includes(path.extname(file).toLowerCase()))) //Use only valid filetypes
            .then(validFiles => validFiles.sort((a, b) => a.localeCompare(b, undefined, {numeric: true}))) //Sort remaining items
            .then(sortedFiles => sortedFiles.map(file => path.join(libraryFolder, folder, file)))
        return fileList;
    }

    return [libraryContents];
}

export default useLibrary;