const fs = require('fs');
const path = require('path');

class StateManager {

    constructor(appPath) {
        this.appPath = appPath;
        if(fs.existsSync(path.join(this.appPath, "settings.json"))) {
            this.readStateFile();
        }
        else {
            this.createStateFile();
        }
    }

    setLibraryFolder(folder) {
        this.currentState = {...this.currentState, libraryFolder: folder};
        this.updateStateFile();
    }

    getLibraryFolder() {
        let currentLibraryFolder = this.currentState['libraryFolder'];
        return currentLibraryFolder;
    }

    updateStateFile() {
        fs.writeFile(path.join(this.appPath, "settings.json"), 
            JSON.stringify(this.currentState), 
            {encoding: 'utf-8'}, (err) => {
                if (!err) {
                    console.log("State file updated.");
                  
                }
                else {
                    console.log("Unable to update state file.");
                    console.log(err);
                }
            }
        );
    }

    readStateFile() {
        fs.readFile(path.join(this.appPath, "settings.json"), {encoding: 'utf-8'}, (err, data) => {
            if (!err) {
                this.currentState = JSON.parse(data);
            }
            else {
                console.log(err);
            }
        });
    }

    createStateFile() {
        let emptyState = {
            libraryFolder: null,
            playBackPositions: null
        }

        fs.writeFile(path.join(this.appPath, "settings.json"), 
            JSON.stringify(emptyState), 
            {encoding: "utf8"},
            (err) => {
                if (!err) {
                    console.log("New state file created.");
                    this.currentState = emptyState;
                }
                else {
                    console.log("Unable to create new state file.");
                    console.log(err);
                }
            }
        );
    }
}

module.exports = StateManager;