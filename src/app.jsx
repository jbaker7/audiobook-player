import React, {useEffect, useState, useRef} from 'react';
import ReactDOM from 'react-dom';

import Library from './Library.jsx';

import './app.scss';
import playButton from './assets/play.svg';
import pauseButton from './assets/pause.svg';
import previousButton from './assets/previous.svg';
import nextButton from './assets/next.svg';
import volumeButton from './assets/volume.svg';
import volumeMutedButton from './assets/mute.svg';
import cover from './assets/cover-image.png';

import useLibrary from './useLibrary.js';

const {ipcRenderer} = window.require('electron');
const mm = window.require('music-metadata');
const {Howl, Howler} = window.require('howler');

function App() {

    const [libraryFolder, setLibraryFolder] = useState();
    const [theme, setTheme] = useState("light");

    const [nowPlayingFolder, setNowPlayingFolder] = useState("");
    const [nowPlayingArtist, setNowPlayingArtist] = useState("");
    const [nowPlayingTrack, setNowPlayingTrack] = useState("");
    const [nowPlayingCover, setNowPlayingCover] = useState();
    const [nowPlayingPosition, setNowPlayingPosition] = useState(0);
    const [nowPlayingDuration, setNowPlayingDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    let nowPlayingInterval;

    const indexRef = useRef();
    const playlistRef = useRef();
    const isDraggingTrackPosition = useRef(false);

    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [playerVolume, setPlayerVolume] = useState(0.4);
    const playerVolumeRef = useRef(); // Must also use ref to prevent the main process from receiving stale values.

    const [volumeControlIsVisible, setVolumeControlIsVisible] = useState(false);
    const [libraryIsVisible, setLibraryIsVisible] = useState(true);

    const libraryContents = useLibrary(libraryFolder);

    useEffect(() => {

        ipcRenderer.send("prefs", ["get"]); //Request preferences from main process on load.

        ipcRenderer.on("prefReply", (event, preferences) => {   //Wait for main process to send preferences,
            setLibraryFolder(preferences.libraryFolder);        //Then load them into state.
            setPlayerVolume(preferences.playerVolume);
            setLibraryIsVisible(preferences.libraryIsVisible);
            setTheme(preferences.theme);
        });

        ipcRenderer.on("libraryChange", (event, arg) => {
            setLibraryFolder(arg)
        });

        ipcRenderer.on("viewChange", (event, arg) => {
            setLibraryIsVisible(arg)
        });

        ipcRenderer.on("themeChange", (event, arg) => {
            setTheme(arg)
        });

        ipcRenderer.on("closing", (event, arg) => {
            
            let positionInfo = {};
            if (playlistRef.current && indexRef.current) {
                positionInfo.file  = playlistRef.current[indexRef.current].file;
                positionInfo.position  = playlistRef.current[indexRef.current].howl.seek();
            }
            let prefs = {"playerVolume": parseFloat(playerVolumeRef.current.value)};
            
            event.sender.send("closed", [positionInfo.file, positionInfo.position, prefs]);
        });

    }, [])

    function changePlaybackSpeed(e) {

        let speed = parseFloat(e.target.value);
        setPlaybackSpeed(speed);
        if (playlistRef.current[indexRef.current].howl) {
            playlistRef.current[indexRef.current].howl.rate(speed);
        }
    }

    function handleTrackPositionDragging(mousePos) {

        if (mousePos === 'down') {
            isDraggingTrackPosition.current = true;
        }
        else {
            seek(nowPlayingPosition);
            isDraggingTrackPosition.current = false;
        }
    }

    function handleTrackPositionSeek(e) {
        setNowPlayingPosition(parseFloat(e.target.value));
    }

    function handleVolumeChange(e) {

        let newVolume = parseFloat(e.target.value);
        Howler.volume(newVolume);
        setPlayerVolume(newVolume);
    }

    function savePlaybackPosition(file, position) {
        ipcRenderer.send("playback", [file, position]);
    }

    function handlePlayPause(folder, track) {

        if (nowPlayingFolder !== folder) {
            if (nowPlayingFolder) {
                if (playlistRef.current[indexRef.current].howl) {
                    let playing = playlistRef.current[indexRef.current];
                    savePlaybackPosition(playing.file, playing.howl.seek());
                    playing.howl.stop();
                }
            }
            setNewPlaylist(libraryContents.find(folders => folders.folderName === folder));

            if(track !== undefined) {skipTo(track);}
                else {skipTo(0);}
        }

        else {
            if(track !== undefined) {skipTo(track);}
            else {
                if (isPlaying === true) {
                    pause();
                }
                else {
                    play();
                }
            } 
        }
    }

    function setNewPlaylist(newPlaylist) {

        let formattedPlaylist = newPlaylist["files"].map(file => ({file: file, howl: null}));

        setNowPlayingFolder(newPlaylist.folderName);
        playlistRef.current = formattedPlaylist;
        indexRef.current = 0;
    }

    function play(index) {

        let sound;
        index = typeof index === 'number' ? index : indexRef.current;
        let data = playlistRef.current[index];

        // If we already loaded this track, use the current one.
        // Otherwise, setup and load a new Howl.
        if (data.howl) {
            sound = data.howl;
        } 
        else {
            sound = playlistRef.current[index].howl = new Howl({
                src: [data.file],
                html5: true,
                rate: playbackSpeed,
                onplay: function() {
                    setIsPlaying(true);
                    setNowPlayingDuration(sound.duration());
                    nowPlayingInterval = setInterval(step, 1000);

                    Howler.volume(playerVolume);
                },
                onload: function() {
                    // Check if there is already a saved start position. If so, begin playback there.
                    let startPosition = ipcRenderer.sendSync("playback", [playlistRef.current[index].file]);
                    if(startPosition) {
                        seek(startPosition);
                    }
                },
                onend: function() {
                    skip('next');
                },
                onpause: function() {
                    setIsPlaying(false);
                }
            });
        }
    
        sound.play();
    
        let metadata = mm.parseFile(data.file)
        .then(meta => {
            setNowPlayingArtist(meta.common.artist);
            setNowPlayingTrack(meta.common.title);
            setNowPlayingCover(meta.common.picture[0]);
        })
    
        indexRef.current = index;
    }

    function pause() {

        let sound = playlistRef.current[indexRef.current].howl;
        sound.pause();
    }

    function skip(direction) {
        
        let index = 0;
        if (direction === 'prev') {
            index = indexRef.current - 1;
            if (index < 0) {
                index = playlistRef.current.length - 1;
            }
        } else {
            index = indexRef.current + 1;
            if (index >= playlistRef.current.length) {
                index = 0;
            }
        }

        skipTo(index);
    }

    function skipTo(index) {
        
        if (playlistRef.current[indexRef.current].howl) {
            let playing = playlistRef.current[indexRef.current];
            savePlaybackPosition(playing.file, playing.howl.seek());
            playing.howl.stop();
        }

        play(index);
    }

    function seek(position) {

        let sound = playlistRef.current[indexRef.current].howl;

        if (sound.playing()) {
            sound.seek(position);
        }
    }

    function step() {

        let sound = playlistRef.current[indexRef.current].howl;

        let seek = sound.seek() || 0;
        if (!isDraggingTrackPosition.current) {
            setNowPlayingPosition(seek);
        }

        if (!sound.playing()) {
            clearInterval(nowPlayingInterval);
        }
    }

    function formatTime(seconds) {

        let min = Math.floor(seconds / 60);
        let sec = ("00" + (seconds % 60).toFixed(0)).slice(-2);
        return `${min}:${sec}`;
    }

    function toggleVolumeControl() {
        setVolumeControlIsVisible(!volumeControlIsVisible);
    }

    let playbackPositionStyle = {
        background: `linear-gradient(to right, #ef7049 0%, #ef7049 ${(nowPlayingPosition / nowPlayingDuration) * 100}%, ${theme === "light" ? "#dee1e6" : "#24211b"} ${(nowPlayingPosition / nowPlayingDuration) * 100}%, ${theme === "light" ? "#dee1e6" : "#24211b"} 100%)`
    }

    let volumePositionStyle = {
        background: `linear-gradient(to right, #ef7049 0%, #ef7049 ${playerVolume * 100}%, ${theme === "light" ? "#dee1e6" : "#24211b"} ${playerVolume * 100}%, ${theme === "light" ? "#dee1e6" : "#24211b"} 100%)`
    }

    return (
        <div className={`main-window ${theme}`}>
            <div className="main-player">
                <div className={`volume-control ${!volumeControlIsVisible ? "hidden" : null}`}>
                    <span onClick={toggleVolumeControl}><img src={playerVolume > 0 ? volumeButton : volumeMutedButton} /></span>
                    <div className="volume-wrapper">
                        <input 
                            onChange={handleVolumeChange}
                            style={volumePositionStyle} 
                            type="range" min="0" max="1" step="0.01" 
                            value={playerVolume}
                            id="volume-slider"
                            ref={playerVolumeRef}
                        />
                    </div>
                </div>
                <div className="album-art">
                    <img src={nowPlayingCover ? `data:${nowPlayingCover.format};base64,${nowPlayingCover.data.toString('base64')}` : cover} />
                </div>
                <div className="track-info">
                    <div className="track-name">{nowPlayingTrack}</div>
                    <div className="track-artist">{nowPlayingArtist}</div>
                </div>
                <div className="track-position-wrapper">
                    <label htmlFor="track-position">{formatTime(nowPlayingPosition)}</label>
                    <input 
                        onMouseDown={() => handleTrackPositionDragging('down')}
                        onMouseUp={() => handleTrackPositionDragging('up')} 
                        onChange={handleTrackPositionSeek}
                        style={playbackPositionStyle} 
                        type="range" min="0" step="1" 
                        max={nowPlayingDuration} 
                        value={nowPlayingPosition} 
                        id="track-position" />
                    <label htmlFor="track-position">{formatTime(nowPlayingDuration)}</label>
                </div>
                <div className="audio-buttons">
                    <span onClick={() => skip("prev")}><img src={previousButton} /></span>

                    {isPlaying ? 
                        <span onClick={pause}><img src={pauseButton} /></span> : 
                        <span onClick={play}><img src={playButton} /></span>
                    }
                    
                    <span onClick={() => skip("next")}><img src={nextButton} /></span>
                </div>
                <div className="playback-speed-wrapper" title="Playback Speed">
                    <input onChange={changePlaybackSpeed} type="radio" name="playback-speed" id="speed1" value="0.5" checked={playbackSpeed === 0.5} />
                        <label htmlFor="speed1">0.5x</label>
                    <input onChange={changePlaybackSpeed} type="radio" name="playback-speed" id="speed2" value="0.75" checked={playbackSpeed === 0.75} />
                        <label htmlFor="speed2">0.75x</label>
                    <input onChange={changePlaybackSpeed} type="radio" name="playback-speed" id="speed3" value="1" checked={playbackSpeed === 1} />
                        <label htmlFor="speed3">1x</label>
                    <input onChange={changePlaybackSpeed} type="radio" name="playback-speed" id="speed4" value="1.25" checked={playbackSpeed === 1.25} />
                        <label htmlFor="speed4">1.25x</label>
                    <input onChange={changePlaybackSpeed} type="radio" name="playback-speed" id="speed5" value="1.5" checked={playbackSpeed === 1.5} />
                        <label htmlFor="speed5">1.5x</label>
                    <div className="indicator"></div>
                </div>
            </div>

           {libraryIsVisible ?
            <Library 
                theme={theme}
                library={libraryContents}
                nowPlayingFolder={nowPlayingFolder}
                nowPlayingIndex={indexRef.current}
                playFunction={handlePlayPause} 
            />
            : null }
        </div>
    )
}

ReactDOM.render(<App />, document.getElementById('root'));