import * as DOM from "./DOMPath.js"
import * as Path from "./Path.js"
import * as Anim from "./PathAnimation.js"

export class NormalAnimation {
    path;
    styler
    #pathHandler;
    #ballHandler;
    #animHandler;
    #schedCrossing = {};

    constructor(pathHandler, ballHandler, styler) {
        this.#pathHandler = pathHandler;
        this.#ballHandler = ballHandler;
        this.styler = styler;
    }

    Configure(path, params) {
        let slicePath = sliceByMask(path, params);

        let beforeSegments = [];
        {
            // split path points into array
            let bFirstPoints = [];
            let bLastPoints = [];
            for (let i = 0; i < slicePath.beforePath.length; i++) {
                bFirstPoints.push(slicePath.beforePath[i].p1);
                bLastPoints.push(slicePath.beforePath[i].p2);
            }

            let isMasked = params.invert;
            // process first points
            {
                // initial point, outlined
                let p = bFirstPoints[0];
                let np = pointByStyler(p,
                    isMasked ? this.styler.init_masked : this.styler.init);
                bFirstPoints[0] = np;

                // subsequent, visible
                for (let i = 1; i < bFirstPoints.length; i++) {
                    p = bFirstPoints[i];
                    np = pointByStyler(p,
                        isMasked ? this.styler.traj_masked : this.styler.traj);
                    bFirstPoints[i] = np;
                }
            }

            // process last points
            {
                let p, np, i;
                // all until tie, invisible
                for (i = 0; i < bLastPoints.length - 1; i++) {
                    p = bLastPoints[i];
                    np = new DOM.SchedPoint(p.x, p.y, isMasked);
                    bLastPoints[i] = np;
                }
                // tie point, outlined
                p = bLastPoints[i];
                np = pointByStyler(p, this.styler.mask);
                bLastPoints[i] = np;
            }

            // assemble segments
            for (let i = 0; i < slicePath.beforePath.length; i++) {
                let seg = slicePath.beforePath[i];
                let nSeg = lineByStyler(bFirstPoints[i], bLastPoints[i], seg.speed,
                    isMasked ? this.styler.traj_masked : this.styler.traj);
                beforeSegments.push(nSeg);
            }
        }

        let afterSegments = [];
        {
            // split path points into array
            let bFirstPoints = [];
            let bLastPoints = [];
            for (let i = 0; i < slicePath.afterPath.length; i++) {
                bFirstPoints.push(slicePath.afterPath[i].p1);
                bLastPoints.push(slicePath.afterPath[i].p2);
            }

            let isMasked = !params.invert;
            // process first points
            {
                let np, p;
                // all points invisible
                for (let i = 1; i < bFirstPoints.length; i++) {
                    p = bFirstPoints[i];
                    np = new DOM.SchedPoint(p.x, p.y, isMasked);
                    bFirstPoints[i] = np;
                }
            }

            // process last points
            {
                let p, np, i;
                // all until tie, invisible
                for (i = 0; i < bLastPoints.length - 1; i++) {
                    p = bLastPoints[i];
                    np = pointByStyler(p,
                        isMasked ? this.styler.traj_masked : this.styler.traj)
                    bLastPoints[i] = np;
                }
                // end point, outlined
                p = bLastPoints[i];
                np = np = pointByStyler(p,
                    isMasked ? this.styler.end_masked : this.styler.end)
                bLastPoints[i] = np;
            }

            // assemble segments
            for (let i = 0; i < slicePath.afterPath.length; i++) {
                let seg = slicePath.afterPath[i];
                let nSeg = lineByStyler(bFirstPoints[i], bLastPoints[i], seg.speed,
                    isMasked ? this.styler.traj_masked : this.styler.traj);
                afterSegments.push(nSeg);
            }

            // add last segment
            {
                let seg = slicePath.afterPath[slicePath.afterPath.length - 1];
                let nRaw = buildToBorder(seg);
                let np0 = new DOM.SchedPoint(nRaw.p1.x, nRaw.p1.y, isMasked);
                let np1 = new DOM.SchedPoint(nRaw.p2.x, nRaw.p2.y, isMasked);

                let nSeg = new DOM.SchedSegment(np0, np1, seg.speed, isMasked);
                afterSegments.push(nSeg);
            }
        }

        this.path = beforeSegments.concat(afterSegments);
    }

    Load() {
        this.#pathHandler.Update(this.path);
        this.#animHandler = new Anim.PathAnimState(this.path);
        this.#animHandler.AdvanceState(0);

        let initPt = this.#animHandler.GetPoint();
        this.#ballHandler.Update(initPt);
    }
}

function pointByStyler(p, style) {
    return DOM.SchedPoint.withStyle(p, style.pointStyle, style.pointMaskStyle);
}

function lineByStyler(p1, p2, speed, style) {
    return DOM.SchedSegment.withStyle(p1, p2, speed, style.lineStyle, style.lineMaskStyle);
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