import * as Lib from "./TrajLibrary.js"
import * as Path from "./Path.js"
import {DOMBallAnimator} from "./DOMBall.js";
import {DOMPathRenderer} from "./DOMPath.js";
import {NormalAnimation} from "./NormalAnimator.js";

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
        this.setInstruction();

        // TODO separate testing trajectories
        this._trajectories = [...Lib.MED_S1.LoadEntries()].splice(3);
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

    async _runNormal(tries) {
        this.setInstruction("instruct_welcome");
        await waitForSpace();

        let anim = new NormalAnimation(this._pathHandler, this._ballHandler);
        let path = this._trajectories[0];
        let mask = calcHalfMask(path);
        anim.Configure(path, mask);
        anim.showResult = true;
        anim.Load();

        this.setInstruction("instruct_normal_waiting");
        await waitForSpace();
        this.setInstruction("instruct_normal_running");
        await anim.Play();

        this.setInstruction("instruct_normal_inspect");
        await waitForSpace();

        this.setInstruction("instruct_normal_repeat");
        for (let i = 1; i < this._trajectories.length; i++) {
            path = this._trajectories[i];
            anim = new NormalAnimation(this._pathHandler, this._ballHandler);
            mask = calcHalfMask(path);
            anim.Configure(path, mask);
            anim.showResult = true;
            anim.Load();

            await anim.Play();
            await new Promise(res => setTimeout(res, 900));
        }

    }
}

export async function waitForSpace() {
    let rmCb;
    let resolveFn;
    let ret = new Promise(res => {resolveFn = res;})
    let cb = (e) => {
        if (e.charCode === 0) {
            console.log("space pressed")
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

function calcHalfMask(path) {
    let dist = Path.PosToDistance(path, {segment: path.length - 1, position:0})
    return {
        countFrom: 0,
        countTo: -1,
        distance: dist / 2,
        invert: false
    }
}