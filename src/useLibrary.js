import {useEffect, useState} from 'react';

const fs = window.require('fs');
const path = window.require('path');

function useLibrary(libraryFolder) {

    const [libraryContents, setLibraryContents] = useState([]);

    const validFormats = [".mp3", ".mpg", ".mpeg", ".opus", ".ogg", ".oga", ".wav", 
        ".aac", ".caf", ".m4a", ".mp4", ".weba", ".webm", ".dolby", ".flac"];

    useEffect(() => {
        if (libraryFolder) {
            scanLibrary(libraryFolder)
            .then(contents => setLibraryContents(contents))
        }
    }, [libraryFolder]);


    async function scanLibrary(folder, files = []) {
        let directoryList = fs.readdirSync(folder, {withFileTypes: true});

        await directoryList.forEach(async (file, index) => {
            if (file.isDirectory()) {                                       // If there are subdirectories in the current folder,
                await scanLibrary(path.join(folder, file.name), files);     // resursively scan them too.
            }
        })

            // Filter out directories and invalid file types from the file list.
        let validFiles = directoryList.filter(file => !file.isDirectory() && validFormats.includes(path.extname(file.name).toLowerCase()));
        
            // Attach full file path to each file, then sort final list.
        let sortedFiles = validFiles.map(file => path.join(folder, file.name)).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
        if (sortedFiles.length) {
            let fileObj = {folderName: folder.split(path.sep)[folder.split(path.sep).length-1], files: sortedFiles};
            files.push(fileObj);
        }
        return files;
    }

    return libraryContents;
}

export default useLibrary;