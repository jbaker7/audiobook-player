import {existsSync} from 'fs';
import {readFile, writeFile} from 'fs/promises';
const path = require('path');

class StateManager {

    constructor(appPath) {
        this.appPath = appPath;
    }

    getPreferences() {
        return this.currentState.preferences;
    }
    setPreferences(newPreferences) {
        
        for (const [pref, value] of Object.entries(newPreferences)) {
            this.currentState.preferences[pref] = value;
        }

        this.updateStateFile();
    }


    get libraryIsVisible() {
        return this.currentState.preferences.libraryIsVisible;
    }
    set libraryIsVisible(isVisible) {
        this.currentState.preferences.libraryIsVisible = isVisible;
        this.updateStateFile();
    }


    get libraryFolder() {
        return this.currentState.preferences.libraryFolder;
    }
    set libraryFolder(folder) {
        this.currentState.preferences.libraryFolder = folder;
        this.updateStateFile();
    }

    getPlaybackPosition(file) {
        if(this.currentState.playBackPositions[file]) {
            return this.currentState.playBackPositions[file];
        }
        else {
            return false;
        }
    }
    setPlaybackPosition(file, position) {

        if(position < 5) {
            // Playback finished or didn't progress far enough to save, clear saved position.
            delete this.currentState.playBackPositions[file]; 
        }
        else {
            // Playback didn't finished, save position.
            this.currentState.playBackPositions[file] = position; 
        }
        
        this.updateStateFile();
    }

    updateStateFile() {
        
        writeFile(path.join(this.appPath, "settings.json"), JSON.stringify(this.currentState), {encoding: 'utf-8'})
            .then(() => console.log("State file updated."))
            .catch(err => {
                console.log(err);
                console.log("Unable to update state file.");
            });
    }

    initializeState = () => {

        return new Promise((resolve, reject) => {
            let emptyState = {
                preferences: {
                    libraryFolder: null,
                    playerVolume: 0.4,
                    libraryIsVisible: true
                },
                playBackPositions: {},
            }
            
            if(existsSync(path.join(this.appPath, "settings.json"))) {
                readFile(path.join(this.appPath, "settings.json"), {encoding: 'utf-8'})
                .then(data => this.currentState = JSON.parse(data))
                .then(() => resolve("Preferences loaded."))
                .catch(err => {
                    this.currentState = emptyState;
                    console.log(err);
                    resolve("Couldn't load preferences. Using defaults");
                })
            }
            else {
                this.currentState = emptyState;
                writeFile(path.join(this.appPath, "settings.json"), JSON.stringify(emptyState), {encoding: "utf8"})
                .then(() => resolve("New preference file created."))
                .catch(err => {
                    console.log(err);
                    resolve("Couldn't create new preference file. Using defaults");
                })
            }
        })
    }
}

export default StateManager;