import * as Lib from "./TrajLibrary.js"
import {DOMBallAnimator} from "./DOMBall.js";
import {DOMPathRenderer} from "./DOMPath.js";

export function ShuffleArray(arr) {
    let resArr = [];
    let srcArr = arr.slice();

    while (srcArr.length > 0) {
        let rPos = Math.round(Math.random() * (srcArr.length - 1))
        resArr.push(srcArr[rPos]);
        srcArr.splice(rPos, 1)
    }

    return resArr;
}

export class TrainLoader {
    _ballHandler;
    _pathHandler;
    _trajectories;
    _instrPopup;
    _instrDoc;

    constructor() {
        this._pathHandler = new DOMPathRenderer();
        this._pathHandler.Update();
        this._ballHandler = new DOMBallAnimator();
        this._instrPopup = document.getElementById('instructionsBox');
        this._instrDoc = document.getElementById('instructionTexts').contentDocument;

        // TODO separate testing trajectories
        this._trajectories = [...Lib.MED_S1.LoadEntries()].splice(3);
    }

    async waitForSpace() {
        let rmCb;
        let resolveFn;
        let ret = new Promise(res => ()=>{resolveFn = res;})
        let cb = (e) => {
            if (e.charCode === 0) {
                resolveFn();
                rmCb();
            }
        }

        document.addEventListener('keydown', cb);
        rmCb = () => {
            document.removeEventListener('keydown', cb);
        }
        return ret;
    }

    setInstruction(id) {
        if (!id) {
            this._instrPopup.innerHTML = '';
            this._instrPopup.classList.add('hidden');
            return;
        }

        let elHtml;
        try {
            elHtml = this._instrDoc.getElementById(id).innerHTML;
        } catch (e) {
            console.warn(e);
            this._instrPopup.innerHTML = '';
            this._instrPopup.classList.add('hidden');
            return;
        }

        this._instrPopup.innerHTML = elHtml;
        this._instrPopup.classList.remove('hidden');
    }

    _runNormal(tries) {

    }
}