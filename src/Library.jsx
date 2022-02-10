import React from 'react';
import LibraryFolder from './LibraryFolder.jsx';
import './Library.css';

function Library({libraryContents, playFunction, nowPlayingFolder, nowPlayingIndex}) {

    return (
        <div className="library">
            {
                libraryContents ? 
                libraryContents.map((folder, index) => {
                    return (
                        <LibraryFolder 
                            nowPlaying={folder.folderName === nowPlayingFolder ? nowPlayingIndex : null}
                            folderContents={folder}
                            playFunction={playFunction}
                            key={`${folder["folderName"].slice(0, 4)}${index}`} 
                        />  
                    )
                })
                : null
            }
            
        </div>
    )
}

export default Library;