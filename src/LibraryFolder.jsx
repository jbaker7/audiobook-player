import React, {useEffect, useState} from 'react';
import cover from './assets/cover-image.png';
import LibraryTrack from './LibraryTrack.jsx';
const mm = window.require('music-metadata');

function LibraryFolder({folderContents, playFunction, nowPlaying}) {

    const [isExpanded, setIsExpanded] = useState(false);
    const [folderAuthor, setFolderAuthor] = useState();
    const [folderTitle, setFolderTitle] = useState();
    const [folderCover, setFolderCover] = useState();

    function toggleIsExpanded() {
        setIsExpanded(!isExpanded);
    }

    useEffect(() => {
        
        let metadata = mm.parseFile(folderContents.files[0])
        .then(meta => {
            setFolderAuthor(meta.common.albumartist || meta.common.artist);
            setFolderTitle(meta.common.album || folderContents.folderName)
            setFolderCover(meta.common.picture[0])
        })

    }, [folderContents])

    return (

        <div className={`folder ${isExpanded ? "expanded" : null}`}>
            <div className="folder-heading">
                <div className={`folder-image ${nowPlaying !== null ? "pause" : "play"}`} onClick={() => playFunction(folderContents.folderName)}>
                    <img src={folderCover ? `data:${folderCover.format};base64,${folderCover.data.toString('base64')}` : cover} />
                </div>
                <div className="folder-info" onClick={toggleIsExpanded}>
                    <div className="album-name">{folderTitle}</div>
                    <div className="album-artist">{folderAuthor}</div>
                </div>
            </div>
            {isExpanded ? 
                <div className="tracks">
                    <ul>
                        {
                            folderContents["files"].map((file, index) => (
                                <LibraryTrack 
                                    playFunction={playFunction}
                                    folderName={folderContents.folderName}
                                    playlistIndex={index}
                                    nowPlaying={index == nowPlaying ? true : false}
                                    file={file} 
                                    key={file}
                                />
                            ))
                        }
                    </ul>
                </div>
            : null}
        </div>
    )
}

export default LibraryFolder;