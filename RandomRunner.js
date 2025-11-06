import {DOMBallAnimator} from "./DOMBall.js";
import {DOMPathRenderer} from "./DOMPath.js";
import {DOMFixationHandler, DOMBannerHandler} from "./DOMBanner.js";
import * as Lib from "./TrajLibrary.js";
import * as Launcher from "./LoggedLaunchers.js";

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

export class RandomRunner {
    pathHandler;
    ballHandler;
    fixHandler;
    bannerHandler;

    TrajLong = {};
    Batches = [];
    totalJournal = [];

    constructor() {
        this.pathHandler = new DOMPathRenderer();
        this.ballHandler = new DOMBallAnimator();
        this.fixHandler = new DOMFixationHandler()
        this.bannerHandler = new DOMBannerHandler();

        // load long entries
        for (let e of Lib.ENTRY_LIST) {
            for (let t of e.LoadEntries()) {
                if (!(e.name in this.TrajLong)) {
                    this.TrajLong[e.name] = [];
                }
                this.TrajLong[e.name].push(t);
            }
        }

        this._prepRepeats();
        console.log(this.Batches)
    }

    _prepRepeats() {
        // create dictionary of trajs with each repeated 3 times
        let _repeatsLong = {};
        for (let [k, v] of Object.entries(this.TrajLong)) {
            let nVals = []
            for (let i= 0; i < 3; i++) { // repeat trajs in each category 3 times
                nVals = nVals.concat(v);
            }
            nVals = ShuffleArray(nVals); // shuffle each category
            _repeatsLong[k] = nVals;
        }

        let _batchesLong = [];
        // create 8 batches
        for (let i = 0; i < 8; i++) {
            let tBatchLong = []; // trajs for occluded and unmasked in batch
            // extract 3 top entries from repeats dict in each paradigm
            for (let [k, v] of Object.entries(_repeatsLong)) {
                let extVals = v.splice(0, 3);
                tBatchLong = tBatchLong.concat(extVals);
            }
            let tBatchShuffle = ShuffleArray(tBatchLong);

            let pBatch = [] // paradigm numbers to shuffle
            for (let j = 0; j < 3; j++) { // 4 paradigms
                for (let k = 0; k < 5; k++) { // 5 repeats each
                    pBatch.push(j)
                }
            }
            let pBatchShuffle = ShuffleArray(pBatch);

            let prepTrials = [];
            for (let v = 0; v < pBatchShuffle.length; v++) {
                let tType = pBatchShuffle[v]; // init trial for each shuffled number
                let tObj = {
                    type: tType
                }
                if (tType !== 3) { // if requires traj, pick first from shuffled trajs
                    tObj.traj = tBatchShuffle.splice(0, 1)[0];
                }
                prepTrials.push(tObj);
            }

            this.Batches.push(prepTrials);
        }
    }

    async Run() {
        for (let i = 0; i < this.Batches.length; i++) {
            alert(`batch ${i} of ${this.Batches.length}`);
            let batch = this.Batches[i];
            for (let j = 0; j < batch.length; j++) {
                let trial = batch[j];
                if (trial.type === 0) {
                    let t = new Launcher.UnmaskedLauncher(trial.traj, this);
                    await t.Run();
                    console.log(t.journal)
                    await this.bannerHandler.waitWithBanner();
                } else if (trial.type === 1) {
                    let t = new Launcher.NormalLauncher(trial.traj, this);
                    await t.Run();
                    console.log(t.journal)
                    await this.bannerHandler.waitWithBanner();
                } else {
                    let t = new Launcher.BackwardLauncher(trial.traj, this);
                    await t.Run();
                    console.log(t.journal)
                    await this.bannerHandler.waitWithBanner();
                }
            }
        }
    }
}