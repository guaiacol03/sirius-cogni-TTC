import {DOMBallAnimator} from "./DOMBall.js";
import {DOMPathRenderer} from "./DOMPath.js";
import {DOMFixationHandler, DOMBannerHandler} from "./DOMBanner.js";
import * as Lib from "./TrajLibrary.js";
import * as Launcher from "./LoggedLaunchers.js";
import * as Path from "./Path.js";

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
            for (let i= 0; i < 15; i++) { // repeat trajs in each category 15 times
                nVals = nVals.concat(v);
            }
            nVals = ShuffleArray(nVals); // shuffle each category
            _repeatsLong[k] = nVals;
        }

        let _repeatsShort = {};
        for (let [k, v] of Object.entries(this.TrajLong)) {
            let nVals = []
            for (let i= 0; i < 10; i++) { // repeat trajs in each category 15 times
                nVals = nVals.concat(v);
            }
            nVals = ShuffleArray(nVals); // shuffle each category
            _repeatsShort[k] = nVals;
        }

        // create list of timings
        let _repeatsTime =[];
        for (let v of Lib.STIMULI_LIST) {
            for (let i= 0; i < 15; i++) { // repeat each timing 15 times
                _repeatsTime.push(v);
            }
        }
        _repeatsTime = ShuffleArray(_repeatsTime);

        let _batchesLong = [];
        // create  batches
        for (let i = 0; i < 15; i++) {
            let tBatchLong = []; // trajs for occluded and unmasked in batch
            // extract 6 top entries from repeats dict in each paradigm
            for (let [k, v] of Object.entries(_repeatsLong)) {
                let extVals = v.splice(0, 6);
                tBatchLong = tBatchLong.concat(extVals);
            }
            let tLongShuffle = ShuffleArray(tBatchLong);

            let tBatchShort = []; // trajs for occluded and unmasked in batch
            // extract 4 top entries from repeats dict in each paradigm
            for (let [k, v] of Object.entries(_repeatsShort)) {
                let extVals = v.splice(0, 4);
                tBatchShort = tBatchShort.concat(extVals);
            }
            let tShortShuffle = ShuffleArray(tBatchShort);

            // extract 3 top entries from repeats dict in each paradigm
            let durBatch = _repeatsTime.splice(0, 3);
            let durBatchShuffle = ShuffleArray(durBatch);

            let pBatch = [] // paradigm numbers to shuffle
            for (let i = 0; i < 4; i++) { // 4 repeats of unmasked
                pBatch.push(0);
            }
            for (let i = 0; i < 6; i++) { // 6 repeats of masked
                pBatch.push(1);
            }
            for (let i = 0; i < 6; i++) { // 6 repeats of reverse
                pBatch.push(2);
            }
            for (let i = 0; i < 3; i++) { // 3 repeats of interval
                pBatch.push(3);
            }
            let pBatchShuffle = ShuffleArray(pBatch);

            let prepTrials = [];
            for (let v = 0; v < pBatchShuffle.length; v++) {
                let tType = pBatchShuffle[v]; // init trial for each shuffled number
                let tTraj;
                switch (tType) {
                    case 1:
                    case 2:
                        tTraj = tLongShuffle.splice(0,1)[0];
                        break;
                    case 0:
                        tTraj = tShortShuffle.splice(0,1)[0];
                        break;
                    case 3:
                        tTraj = durBatchShuffle.splice(0,1)[0];
                        break;
                }

                prepTrials.push({type: tType, traj: tTraj});
            }

            this.Batches.push(prepTrials);
        }
    }

    async Run() {
        for (let i = 0; i < this.Batches.length; i++) {
            let batch = this.Batches[i];
            let logOvershoot = [];

            for (let j = 0; j < batch.length; j++) {
                let trial = batch[j];
                let t;
                switch (trial.type) {
                    case 0:
                        t = new Launcher.UnmaskedLauncher(trial.traj, this);
                        break;
                    case 1:
                        t = new Launcher.NormalLauncher(trial.traj, this);
                        break;
                    case 2:
                        t = new Launcher.BackwardLauncher(trial.traj, this);
                        break;
                    case 3:
                        t = new Launcher.StimuliLauncher(trial.traj, this);
                        break;
                }
                await t.Run();
                let err;
                if (trial.type <= 1) {
                    let fullLen = Path.TotalDistance(trial.traj);
                    err = Math.abs(t.journal.overshoot) / fullLen
                } else if (trial.type === 2) {
                    let fullTime = t.journal.endTime - t.journal.startTime;
                    err = Math.abs(t.journal.judgement - fullTime) / fullTime;
                } else {
                    err = Math.abs(t.journal.judgement - t.journal.trajectory) / t.journal.trajectory;
                }
                logOvershoot.push(err);

                console.log(t.journal)
                await this.bannerHandler.waitWithBanner();
            }

            let errSum = 0;
            for (let j = 0; j < logOvershoot.length; j++) {
                errSum += logOvershoot[j];
            }

            await this.bannerHandler.endWithBanner({
                batch_count: this.Batches.length,
                batch: i+1,
                avg_accuracy: (errSum / this.Batches.length) * 100

            })
        }
    }
}