import {DOMBallAnimator} from "./DOMBall.js";
import {DOMPathRenderer} from "./DOMPath.js";
import {DOMFixationHandler, DOMBannerHandler} from "./DOMBanner.js";
import * as Launcher from "./LoggedLaunchers.js";
import * as Path from "./Path.js";
import {Point, Segment} from "./Path.js";

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

export class StaticRunner {
    pathHandler;
    ballHandler;
    fixHandler;
    bannerHandler;
    saveButton;

    tag;
    Batches;
    trajDict = {};
    totalJournal = [];

    constructor() {
        this.pathHandler = new DOMPathRenderer();
        this.ballHandler = new DOMBallAnimator();
        this.fixHandler = new DOMFixationHandler()
        this.bannerHandler = new DOMBannerHandler();
        let library = JSON.parse(document.getElementById("trajJsonLib").
            contentDocument.getElementsByClassName("library_json")[0].textContent);

        console.log(library);
        this.tag = library.tag;
        this.Batches = library.batches;

        for (let i = 0; i < this.Batches.length; i++) {
            let batch = this.Batches[i];
            for (let j = 0; j < batch.length; j++) {
                let trial = batch[j];
                if (trial.type !== 3) {
                    let traj = trial.traj;
                    if (traj.tag && traj.tag in this.trajDict) {
                        trial.traj = this.trajDict[traj.tag];
                    } else {
                        let nTraj = {
                            segments: convTrajectory(traj),
                            mask: {
                                countFrom: 0, countTo: -1, distance: traj.mask, invert: false
                            },
                            tag: traj.tag,
                        }
                        trial.traj = nTraj
                        if (traj.tag) {
                            this.trajDict[traj.tag] = nTraj;
                        }
                    }
                }
            }
        }

        console.log(this.Batches)
    }

    async Run() {
        for (let i = 0; i < this.Batches.length; i++) {
            let batch = this.Batches[i];
            let logOvershoot = [];
            let startTime = performance.now();
            this.totalJournal[i] = {startTime, tag: this.tag, journal:[]};

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
                    let fullLen = Path.TotalDistance(trial.traj.segments);
                    err = Math.abs(t.journal.overshoot) / fullLen
                } else if (trial.type === 2) {
                    let fullTime = t.journal.endTime - t.journal.startTime;
                    err = Math.abs(t.journal.judgement - fullTime) / fullTime;
                } else {
                    err = Math.abs(t.journal.judgement - t.journal.trajectory) / t.journal.trajectory;
                }
                logOvershoot.push(err);
                t.journal.tag = trial.traj.tag;
                this.totalJournal[i].journal.push(t.journal);

                console.log(t.journal)
                await this.bannerHandler.waitWithBanner();
            }
            let endTime = performance.now();

            let errSum = 0;
            for (let j = 0; j < logOvershoot.length; j++) {
                errSum += logOvershoot[j];
            }

            let res = await this.bannerHandler.endWithBanner({
                batch_count: this.Batches.length,
                batch: i+1,
                avg_accuracy: (errSum / this.Batches[i].length) * 100
            })
            this.totalJournal[i] = Object.assign({
                duration: endTime - startTime,
                judgement: res,
                errSum: errSum,
            }, this.totalJournal[i]);
        }
    }
}

export function convTrajectory(src) {
    let traj = [];
    let pts = src.points;
    for (let i = 1; i < pts.length; i++) {
        let np0 = new Point(pts[i - 1].x, pts[i - 1].y);
        let np1 = new Point(pts[i].x, pts[i].y);

        let seg = new Segment(np0, np1, src.speed);
        traj.push(seg);
    }
    return traj;
}
