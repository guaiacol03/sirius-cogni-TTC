import * as Path from "./Path.js";
import {NormalAnimator} from "./NormalAnimator.js";

export class UnmaskedLauncher {
    journal = {
        passSegments: []
    };
    player;

    constructor(path, pRender, bRender) {
        this.player = new NormalAnimator(pRender, bRender);
        this.player.Configure(path);
        this.player.stopAtEnd = false;

        this.player.advanceCB = this.loggerCallback.bind(this);
    }

    loggerCallback(time) {
        if (this.player._animHandler.segment !== this.player._lastLevel) {
            this.journal.passSegments[this.player._animHandler.segment] = time;
        }
    }

    async Run() {
        this.player.Load();
        await this.player.Play();

        this.journal["startTime"] = this.player._animHandler.startTimestamp;
        this.journal["endTime"] = this.player._animHandler.lastTimestamp;

        this.journal["endReason"] = this.player.endCode;
        if (this.player.endCode === "LastPoint") {
            this.journal["overshoot"] = 0;
            // if animator overshoots from imperfect frame subdivision
            // TODO should not be necessary - end always triggers on overshoot frame
            if (this.player._animHandler.segment >= this.player.path.length - 1) {
                this.journal["overshoot"] = this.player._animHandler.position;
            }
        } else if (this.player.endCode === "Spacebar") {
            // path is always elongated with a final segment, even if player stops at target point
            let totalDist = Path.PosToDistance(this.player.srcPath,
                {segment: this.player.path.length - 1, position: 0});
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
}