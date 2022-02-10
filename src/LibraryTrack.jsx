import React, {useEffect, useState} from 'react';
const mm = window.require('music-metadata');

function LibraryTrack({folderName, file, playFunction, playlistIndex, nowPlaying}) {

    const [metaData, setMetaData] = useState();

    useEffect(() => {
        let metadata = mm.parseFile(file)
        .then(meta => setMetaData(meta))
    }, [file])

    function secondsToMinutes(seconds) {
        let min = Math.floor(seconds / 60);
        let sec = ("00" + (seconds % 60).toFixed(0)).slice(-2);
        return `${min}:${sec}`;
    }

    return (

        <li onClick={() => playFunction(folderName, playlistIndex)} className={`${nowPlaying ? "playing" : null}`} >
            <span className="library-track-name">{metaData ? metaData.common.title : ""}</span>
            <span className="library-track-length">{metaData ? secondsToMinutes(metaData.format.duration) : ""}</span>
        </li> 
    )
}

export default LibraryTrack;