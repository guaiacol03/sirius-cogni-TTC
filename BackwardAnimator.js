import {NormalAnimator} from "./NormalAnimator.js";
import * as Anim from "./PathAnimation.js";
import * as Path from "./Path.js";

// TODO should be removed, but needs discussion as tutorial
// Do not use in real tests

export class BackwardAnimator extends NormalAnimator {
    SRealBall;
    SSrcPath;

    constructor(pathHandler, ballHandler) {
        super(pathHandler, ballHandler);
        this.SRealBall = this._ballHandler;
    }

    Configure(path) {
        this.SSrcPath = path;
    }

    _STermEvent() {
        this._resolveFn();
    }

    LoadForward() {
        super.Configure(this.SSrcPath, null);
        this.endCode = null;
        this._termEvent = this._STermEvent;
        this._ballHandler = this.SRealBall;
        this.stopAtEnd = true;
        this.Load();
    }

    async PlayForward() {
        let prom = new Promise((res) => { this._resolveFn = res; });

        window.requestAnimationFrame((time) => {
            this._animHandler.Start(time);
            this._advancePlay(time);
        });
        return prom;
    }

    _STermEventBw() {
        this.SRealBall.Update(this._animHandler.GetPoint());
        this._resolveFn();
    }

    async PlayBackward() {
        this.stopAtEnd = false;
        this.showResult = true;
        return super.Play()
    }

    LoadBackward() {
        this.endCode = null;

        this._termEvent = this._STermEventBw;
        // replace ballHandler with a stub
        super.Configure(Path.InvertPath(this.SSrcPath), null);
        this._ballHandler = {
            Update: (e)=>{
                console.log(e)
            }
        };
        //TODO actually set invisible style
        this.SRealBall.Update(new Path.Point(0, 0))
        this.Load();
    }
}