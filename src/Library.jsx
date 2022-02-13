import React from 'react';
import LibraryFolder from './LibraryFolder.jsx';
import './Library.scss';

function Library({theme, libraryContents, playFunction, nowPlayingFolder, nowPlayingIndex}) {

    return (
        <div className={`library ${theme}`}>
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