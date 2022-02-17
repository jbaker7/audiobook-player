import React from 'react';
import LibraryFolder from './LibraryFolder.jsx';
import './Library.scss';

function Library({theme, library, playFunction, nowPlayingFolder, nowPlayingIndex}) {

    return (
        <div className={`library ${theme}`}>
            {
                library ? 
                library.map((folder, index) => {
                    return (
                        <LibraryFolder 
                            nowPlaying={folder.folderName === nowPlayingFolder ? nowPlayingIndex : null}
                            folderContents={folder}
                            playFunction={playFunction}
                            key={folder["folderName"]} 
                        />  
                    )
                })
                : null
            }
        </div>
    )
}

export default Library;