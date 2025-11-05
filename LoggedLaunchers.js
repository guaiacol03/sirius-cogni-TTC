import * as Path from "./Path.js";
import {NormalAnimator} from "./NormalAnimator.js";

export class UnmaskedLauncher {
    journal = {
        passSegments: []
    };
    _fixPoint;
    player;

    constructor(path, pRender, bRender, fRender) {
        this.Run = UnmaskedLauncher._run.bind(this);

        this._fixPoint = fRender;
        this.player = new NormalAnimator(pRender, bRender);
        this.player.Configure(path, null);
        this.player.stopAtEnd = false;
        this.player.showResult = false;

        this.player.advanceCB = this.loggerCallback.bind(this);
    }

    loggerCallback(time) {
        if (this.player._animHandler.segment !== this.player._lastLevel) {
            this.journal.passSegments[this.player._animHandler.segment] = time;
        }
    }

    static async _run() {
        // erase everything
        this.player._ballHandler.style = "svg_point_hidden";
        this.player._ballHandler.Update(null);
        this.player._pathHandler.Update(null)

        this._fixPoint.Update(true)
        await new Promise(resolve => setTimeout(resolve, 900));

        this.player._ballHandler.style = "floating_ball+10";
        this.player.Load();
        await this.player.Play();

        this.journal["startTime"] = this.player._animHandler.startTimestamp;
        this.journal["endTime"] = this.player._animHandler.lastTimestamp;

        this.journal["endReason"] = this.player.endCode;
        // endCode === "LastPoint" should never occur
        if (this.player.endCode === "Spacebar") {
            // path is always elongated with a final segment, even if player stops at target point
            let totalDist = Path.TotalDistance(this.player.srcPath);
            let userDist = Path.PosToDistance(this.player.path, this.player._animHandler);

            this.journal["overshoot"] = userDist - totalDist;
        } else if (this.player.endCode === "Overshoot") {
            // if animator overshoots even the last segment (from imperfect frame subdivision)
            // !! when path ends naturally, overshoot is counted towards position of the same segment
            this.journal["overshoot"] = this.player._animHandler.position;
        }
        await new Promise(resolve => setTimeout(resolve, 900));
    }
}

export class NormalLauncher {
    journal = {
        passSegments: []
    };
    player;
    _fixPoint;

    constructor(path, pRender, bRender, fRender) {
        this.Run = UnmaskedLauncher._run.bind(this);

        this._fixPoint = fRender;
        this.player = new NormalAnimator(pRender, bRender);
        let cMsk = calcHalfMask(path);
        this.player.Configure(path, cMsk);
        this.player.stopAtEnd = false;

        this.player.advanceCB = this.loggerCallback.bind(this);
    }

    loggerCallback(time) {
        let seg = this.player._animHandler.segment
        if (seg !== this.player._lastLevel) {
            let calcSeg = (
                this.player._sliceLengths.beforePath > 0 &&
                seg >= this.player._sliceLengths.beforePath) ?
                seg : seg - 1;

            if (this.player._sliceLengths.beforePath > 0 && seg === this.player._sliceLengths.beforePath) {
                this.journal["passMask"] = time;
            } else {
                this.journal.passSegments[calcSeg] = time;
            }
        }
    }
}

export function calcHalfMask(path) {
    let dist = Path.TotalDistance(path)
    return {
        countFrom: 0,
        countTo: -1,
        distance: dist / 2,
        invert: false
    }
}

export class BackwardLauncher {
    journal = {};
    player;
    timeSpan = null;
    _fixPoint;

    constructor(path, pRender, bRender, fRender) {
        this._fixPoint = fRender;
        this.player = new NormalAnimator(pRender, bRender);
        this.player.Configure(path, null);
        this.player.stopAtEnd = true;
    }

    async Run() {
        this.player._ballHandler.style = "svg_point_hidden";
        this.player._ballHandler.Update(null);
        this.player._pathHandler.Update(null)

        this._fixPoint.Update(true)
        await new Promise(resolve => setTimeout(resolve, 900));

        this.player._ballHandler.style = "floating_ball+10";
        this.player.Load();
        await this.player.PlayFull();

        this.journal["startTime"] = this.player._animHandler.startTimestamp;
        this.journal["endTime"] = this.player._animHandler.lastTimestamp;
        this.timeSpan = this.player._animHandler.lastTimestamp - this.player._animHandler.startTimestamp;

        await this.waitingCB();

        // revert path
        let rPlayer = new NormalAnimator(this.player._pathHandler, this.player._ballHandler);
        let rPath = Path.InvertPath(this.player.srcPath);
        rPlayer.Configure(rPath, null);
        this.player._ballHandler.style = "svg_point_hidden";
        rPlayer.Load()


        let currTime = performance.now();
        await waitForSpace();
        let finTime = performance.now();

        this.journal["judgement"] = finTime - currTime;
    }

    async waitingCB() {
        return new Promise(res => {setTimeout(res, 900)})
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