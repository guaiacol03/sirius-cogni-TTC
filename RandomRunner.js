import {DOMBallAnimator} from "./DOMBall.js";
import {DOMPathRenderer} from "./DOMPath.js";
import {DOMFixationHandler, DOMBannerHandler} from "./DOMBanner.js";
import * as Lib from "./TrajLibrary.js";
import * as Launcher from "./LoggedLaunchers.js";

export class RandomRunner {
    pathHandler;
    ballHandler;
    fixHandler;
    bannerHandler;

    constructor() {
        this.pathHandler = new DOMPathRenderer();
        this.ballHandler = new DOMBallAnimator();
        this.fixHandler = new DOMFixationHandler()
        this.bannerHandler = new DOMBannerHandler();
    }

    async Run() {
        let trajs  = [...Lib.MED_S1.LoadEntries()];
        while (true) {
            for (let i = 0; i < trajs.length; i++) {
                let type = Math.round(Math.random() * 2)
                console.log(type);
                if (type === 0) {
                    let t = new Launcher.UnmaskedLauncher(trajs[i], this);
                    await t.Run();
                    console.log(t.journal)
                    await this.bannerHandler.waitWithBanner();
                } else if (type === 1) {
                    let t = new Launcher.NormalLauncher(trajs[i], this);
                    await t.Run();
                    console.log(t.journal)
                    await this.bannerHandler.waitWithBanner();
                } else {
                    let t = new Launcher.BackwardLauncher(trajs[i], this);
                    await t.Run();
                    console.log(t.journal)
                    await this.bannerHandler.waitWithBanner();
                }
            }
        }
    }
}