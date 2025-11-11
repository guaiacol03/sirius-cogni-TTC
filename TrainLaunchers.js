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