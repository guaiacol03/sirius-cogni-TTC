import * as DOM from "./DOMPath.js"
import * as Path from "./Path.js"
import * as Anim from "./PathAnimation.js"

export class NormalAnimation {
    srcPath;
    path;
    showResult;
    stopAtEnd;
    endCode;
    _pathHandler;
    _ballHandler;
    _animHandler;

    constructor(pathHandler, ballHandler) {
        this._pathHandler = pathHandler;
        this._ballHandler = ballHandler;
    }

    Configure(path, params) {
        const styles = {
            traj: 'svg_traj',
            traj_masked: 'svg_mask_traj',
            point: 'svg_point+5',
            point_masked: 'svg_mask_point+25',
            target: 'svg_point+5'
        }

        const simpleConvert = (pts, isMasked, visible) => {
            let nPts = [];
            for (let i = 0; i < pts.length; i++) {
                let p = pts[i];

                let np;
                if (visible) {
                    np = DOM.SchedPoint.withStyle(p, styles.point,
                        isMasked ? styles.point_masked : null);
                } else {
                    np = new DOM.SchedPoint(p.x, p.y, isMasked);
                }
                nPts.push(np);
            }
            return nPts;
        }

        const simpleTrajMerge = (p1, p2, traj, isMasked, visible) => {
            let nTraj = [];
            for (let i = 0; i < traj.length; i++) {
                let seg = traj[i];
                let nSeg;
                if (visible) {
                    nSeg = DOM.SchedSegment.withStyle(p1[i], p2[i], seg.speed,
                        styles.traj, isMasked ? styles.traj_masked : null);
                } else {
                    nSeg = new DOM.SchedSegment(p1[i], p2[i], seg.speed, isMasked);
                }
                nTraj.push(nSeg);
            }
            return nTraj;
        }

        const simpleTrajSplit = (traj) => {
            let rp1 = [];
            let rp2 = [];
            for (let i = 0; i < traj.length; i++) {
                rp1.push(traj[i].p1);
                rp2.push(traj[i].p2);
            }
            return { p1: rp1, p2: rp2 }
        }

        this.srcPath = path;
        let slicePath = sliceByMask(path, params);

        let beforePts = simpleTrajSplit(slicePath.beforePath);

        let convBP = simpleConvert(beforePts.p1, false, false)
        let convAP = simpleConvert(beforePts.p2, false, false)
        let convBefore = simpleTrajMerge(convBP, convAP, slicePath.beforePath, false, true);

        let afterPts = simpleTrajSplit(slicePath.afterPath);

        convBP = simpleConvert(afterPts.p1, true, false)
        convAP = simpleConvert(afterPts.p2, true, false)
        { // mark last point
            let lp = convAP[convAP.length - 1];
            let nlp = DOM.SchedPoint.withStyle(lp, styles.target, styles.point_masked);
            convAP[convAP.length - 1] = nlp;
        }
        let convAfter = simpleTrajMerge(convBP, convAP, slicePath.afterPath, true, true);

        { // add final extension
            let lSeg = slicePath.afterPath[slicePath.afterPath.length - 1];
            let finSeg = buildToBorder(lSeg);

            let convP = simpleConvert([finSeg.p1, finSeg.p2], true, false)
            let convSeg = simpleTrajMerge([convP[0]], [convP[1]], [lSeg],
                true, false);
            convAfter = convAfter.concat(convSeg);
        }

        this.path = convBefore.concat(convAfter);
    }

    startTime;
    _lastLevel
    _resolveFn
    Play() {
        this._lastLevel = this._animHandler.segment;
        let prom = new Promise((res) => { this._resolveFn = res; });
        this._spaceEventInst = this._spaceEvent.bind(this);

        window.addEventListener('keydown', this._spaceEventInst);
        window.requestAnimationFrame((time) => {
            this.startTime = time;
            this._animHandler.Start(time);
            this._advancePlay(time);
        });
        return prom;
    }

    Stop() {
        this.endCode = "External";
        this._termEvent();
    }

    _spaceEvent(e) {
        if (e.charCode === 0) {
            this.endCode = "Spacebar";
            this._termEvent();
        }
    }
    _spaceEventInst;

    _termEvent() {
        window.removeEventListener('keydown', this._spaceEventInst);

        if (this.showResult) {
            this._pathHandler.ArrangeLayer(-Infinity);
        }
        this._resolveFn();
    }

    _advancePlay(time) {
        this._animHandler.AdvanceState(time)
        this._ballHandler.Update(this._animHandler.GetPoint());

        let seg = this._animHandler.segment;
        if (seg !== this._lastLevel) {
            this._pathHandler.ArrangeLayer(seg);
            this._lastLevel = seg;
        }

        if (this._animHandler.endTimestamp) {
            this.endCode = "Overshoot";
        }
        if (this.stopAtEnd && (this._animHandler.segment >= this.path.length - 1)) {
            this.endCode = "LastPoint";
        }

        if (!this.endCode) {
            window.requestAnimationFrame(this._advancePlay.bind(this));
        } else {
            this._termEvent();
        }
    }

    Load() {
        this._pathHandler.Update(this.path);
        this._animHandler = new Anim.PathAnimState(this.path);
        this._animHandler.AdvanceState(0);

        let initPt = this._animHandler.GetPoint();
        this._ballHandler.Update(initPt);
    }

    ProxyExec(fn) {
        fn.bind(this)();
    }
}

function buildToBorder(seg) {
    let dirY = seg.p2.y - seg.p1.y;
    let dirX = seg.p2.x - seg.p1.x;

    let cX;
    if (dirX >= 0) {
        let dX = 600 - seg.p2.x;
        cX = dX / dirX;
    } else {
        let dX = seg.p2.x;
        cX = dX / (-dirX);
    }

    let cY;
    if (dirY >= 0) {
        let dY = 400 - seg.p2.y;
        cY = dY / dirY;
    } else {
        let dY = seg.p2.y;
        cY = dY / (-dirY);
    }

    let c = Math.min(cX, cY);
    let nSeg = new Path.Segment(
        seg.p2,
        new Path.Point(seg.p2.x + (dirX * c), seg.p2.y + (dirY * c)),
        seg.speed
    );
    return nSeg
}

class maskParams {
    countFrom;
    countTo;
    distance;
    invert;
}

function sliceByMask(path, params) {
    let len = path.length;
    if (params.countTo < 0) {
        params.countTo = len;
    }

    let cropPath = path.slice(params.countFrom, params.countTo)
    let srcCropPath = cropPath;
    if (params.invert) {
        cropPath = Path.InvertPath(cropPath);
    }

    let splitPt = Path.FindByDistance(cropPath, params.distance);
    if (params.invert) {
        splitPt = Path.InvertPos(srcCropPath, splitPt);
    }

    return Path.SplitPath(srcCropPath, splitPt);
}