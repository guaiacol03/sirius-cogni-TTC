import * as Path from "./Path.js";
import {NormalAnimator} from "./NormalAnimator.js";

export class UnmaskedLauncher {
    journal = {
        passSegments: []
    };
    _fixPoint;
    player;

    constructor(path, meta) {
        this._fixPoint = meta.fixHandler;
        this.player = new NormalAnimator(meta.pathHandler, meta.ballHandler);
        this.player.Configure(path.segments, null);
        this.player.stopAtEnd = false;
        this.player.showResult = false;

        this.player.advanceCB = this.loggerCallback.bind(this);
    }

    firstLock = true;
    loggerCallback(time) {
        if (this.firstLock) {
            this.journal.passSegments[0] = time;
            this.firstLock = false;
        }

        if (this.player._animHandler.segment !== this.player._lastLevel) {
            this.journal.passSegments[this.player._animHandler.segment] = time;
        }
    }

    async Run() {
        await UnmaskedLauncher._run.apply(this, [0]);
        await new Promise(resolve => setTimeout(resolve, 900));
    }

    static async _run(testId) {
        // erase everything
        this.player._ballHandler.Update();
        this.player._pathHandler.Update()

        this._fixPoint.Update(testId)
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
    }
}

export class NormalLauncher {
    journal = {
        passSegments: []
    };
    player;
    testId = 1;
    _fixPoint;

    constructor(path, meta) {
        this._fixPoint = meta.fixHandler;
        this.player = new NormalAnimator(meta.pathHandler, meta.ballHandler);
        this.player.Configure(path.segments, path.mask);
        this.player.stopAtEnd = false;

        this.player.advanceCB = this.loggerCallback.bind(this);
    }

    async Run() {
        await UnmaskedLauncher._run.apply(this, [1]);
    }

    // TODO fix gaps in indexing of calcSeg
    firstLock = true;
    loggerCallback(time) {
        if (this.firstLock) {
            this.journal.passSegments.push(time);
            this.firstLock = false;
        }

        let seg = this.player._animHandler.segment
        if (seg !== this.player._lastLevel) {
            let calcSeg = (
                this.player._sliceLengths.beforePath > 0 &&
                seg >= this.player._sliceLengths.beforePath) ?
                seg - 1 : seg;

            console.log(seg);
            if (this.player._sliceLengths.beforePath > 0 && seg === this.player._sliceLengths.beforePath) {
                this.journal["passMask"] = time;
            } else {
                this.journal.passSegments.push(time);
            }
        }
    }
}

export class BackwardLauncher {
    journal = {};
    player;
    timeSpan = null;
    _fixPoint;

    constructor(path, meta) {
        this._fixPoint = meta.fixHandler;
        this.player = new NormalAnimator(meta.pathHandler, meta.ballHandler);
        this.player.Configure(path.segments, null);
        this.player.stopAtEnd = true;
    }

    async Run() {
        this.player._ballHandler.Update();
        this.player._pathHandler.Update()

        this._fixPoint.Update(2)
        await new Promise(resolve => setTimeout(resolve, 900));

        this.player._ballHandler.style = "floating_ball+10";
        this.player.Load();
        await this.player.PlayFull();

        this.journal["startTime"] = this.player._animHandler.startTimestamp;
        this.journal["endTime"] = this.player._animHandler.lastTimestamp;
        this.timeSpan = this.player._animHandler.lastTimestamp - this.player._animHandler.startTimestamp;

        await this.waitingCB();

        this.player._ballHandler.Update();
        this.player._pathHandler.Update();
        this._fixPoint.Update(3)
        let currTime = performance.now();
        let v = await Promise.any([
            waitForKey(), // wait for space
            new Promise(res => setTimeout(res, 10000, true)) // or 10s
        ]);
        let finTime = performance.now();

        this.journal["answered"] = !Boolean(v);
        this.journal["judgement"] = finTime - currTime;
    }

    async waitingCB() {
        return new Promise(res => {setTimeout(res, 900)})
    }
}

export class StimuliLauncher {
    duration
    journal = {}

    constructor(dur, meta) {
        this._fixPoint = meta.fixHandler;
        this.duration = dur;

        meta.pathHandler.Update();
        meta.ballHandler.Update();
    }

    async Run() {
        // show cross for 900ms
        this.journal["startTime"] = performance.now();
        this._fixPoint.Update(3);
        await new Promise(res => setTimeout(res, 900));

        // show point for duration
        this.journal["trajectory"] = this.duration;
        this._fixPoint.Update(0);
        await new Promise(res => setTimeout(res, this.duration));

        // show cross for 900ms
        this._fixPoint.Update(3);
        await new Promise(res => setTimeout(res, 900));

        // wait for user press
        let startTime = performance.now();
        this._fixPoint.Update(0);
        let v = await Promise.any([
            waitForKey(), // wait for space
            new Promise(res => setTimeout(res, 10000, true)) // or 10s
        ]);
        let endTime = performance.now();

        this.journal["answered"] = !Boolean(v);
        this.journal["judgement"] = endTime - startTime;
        console.log(this.journal);
    }
}

export async function waitForKey(code = " ") {
    let rmCb;
    let resolveFn;
    let ret = new Promise(res => {resolveFn = res;})
    let cb = (e) => {
        console.log(`${e.key} pressed`)
        if (e.key === code) {
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