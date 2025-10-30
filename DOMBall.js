import * as DOM from "./DOMPath.js"
import * as Path from "./Path.js"
import * as PathAnim from "./PathAnimation.js"

export class DOMBallAnimator {
    #ball;
    #midLayer;
    style;

    static #defaultPoint = new Path.Point(0, 0);
    static #defaultRadius = 10;
    static #defaultStyle = 'ball_invisible';

    constructor() {
        this.#midLayer = document.getElementById("svg_ball_middle");

        this.#ball = DOM.makePoint(
            DOMBallAnimator.#defaultPoint,
            DOMBallAnimator.#defaultRadius,
            DOMBallAnimator.#defaultStyle);
        this.#midLayer.appendChild(this.#ball);
    }

    Update(point) {
        if (point) {
            this.#ball.setAttribute("cx", point.x);
            this.#ball.setAttribute("cy", point.y);
        }
        this.#ball.setAttribute("class", this.style);
    }
}

export const Styler = {
    init: {
        pointStyle: 'svg_point',
        lineStyle: 'svg_traj',
    },
    init_masked: {
        pointStyle: 'svg_point',
        lineStyle: 'svg_traj',
        pointMaskStyle: 'svg_mask_point',
        lineMaskStyle: 'svg_mask_traj'
    },
    end: {
        pointStyle: 'svg_point',
        lineStyle: 'svg_traj',
    },
    end_masked: {
        pointStyle: 'svg_point',
        lineStyle: 'svg_traj',
        pointMaskStyle: 'svg_mask_point',
        lineMaskStyle: 'svg_mask_traj'
    },
    traj: {
        pointStyle: 'svg_point',
        lineStyle: 'svg_traj',
    },
    traj_masked: {
        pointStyle: 'svg_point',
        lineStyle: 'svg_traj',
        pointMaskStyle: 'svg_mask_point',
        lineMaskStyle: 'svg_mask_traj'
    },
    mask: {
        pointStyle: 'svg_point',
        lineStyle: 'svg_traj',
        pointMaskStyle: 'svg_mask_point',
        lineMaskStyle: 'svg_mask_traj'
    }
}

export class NormalAnimation {
    path;
    styler
    #pathHandler;
    #ballHandler;
    #schedCrossing = {};

    constructor(pathHandler, ballHandler, styler) {
        this.#pathHandler = pathHandler;
        this.#ballHandler = ballHandler;
        this.styler = styler;
    }

    RebuildPath(path, params) {
        let slicePath = sliceByMask(path, params);
        let newPath = [];

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

    // Configure(path, params) {
    //     if (params.countFrom > path.length - 1) {
    //         throw new Error("Path start segment out of bounds: " + params.countFrom.toString());
    //     }
    //     if (params.countTo > path.length) {
    //         throw new Error("Path end segment out of bounds: " + params.countTo.toString());
    //     }
    //
    //     let slicePath = sliceByMask(path, params);
    //
    //     let newPath = [];
    //
    //     let isMasked = params.invert;
    //     // assign first point
    //     {
    //         let seg = slicePath.beforePath[0];
    //         let np0 = pointByStyler(seg.p1,
    //             isMasked ? this.styler.init_masked : this.styler.init);
    //         let np1 = pointByStyler(seg.p2,
    //             isMasked ? this.styler.traj_masked : this.styler.traj);
    //         // TODO start handler
    //         np0.callback = () => {};
    //
    //         let nSeg = lineByStyler(np0, np1, seg.speed,
    //             isMasked ? this.styler.traj_masked : this.styler.traj);
    //         newPath.push(nSeg);
    //     }
    //
    //     // assign subsequent until mask
    //     let i;
    //     for (i = 1; i < slicePath.beforePath.length - 1; i++) {
    //         let seg = slicePath.beforePath[i];
    //         let np0 = new DOM.SchedPoint(seg.p1.x, seg.p2.y, isMasked);
    //         let np1 = pointByStyler(seg.p2,
    //             isMasked ? this.styler.traj_masked : this.styler.traj);
    //         // TODO start handler
    //         np0.callback = () => {};
    //
    //         let nSeg = lineByStyler(np0, np1, seg.speed,
    //             isMasked ? this.styler.traj_masked : this.styler.traj);
    //         newPath.push(nSeg);
    //     }
    //
    //     // assign mask break point
    //     {
    //         let seg = slicePath.beforePath[i];
    //         let np0 = new DOM.SchedPoint(seg.p1.x, seg.p2.y, isMasked);
    //         let np1 = pointByStyler(seg.p2, this.styler.mask);
    //         // TODO start handler
    //         np0.callback = () => {};
    //         // handler for mask break
    //         np1.callback = () => {};
    //
    //         let nSeg = lineByStyler(np0, np1, seg.speed,
    //             isMasked ? this.styler.traj_masked : this.styler.traj);
    //         newPath.push(nSeg);
    //     }
    //
    //     isMasked = !params.invert;
    //
    //     // assign subsequent within mask
    //     for (i = 0; i < slicePath.afterPath.length - 1; i++) {
    //         let seg = slicePath.afterPath[i];
    //         let np0 = new DOM.SchedPoint(seg.p1.x, seg.p2.y, isMasked);
    //         let np1 = pointByStyler(seg.p2,
    //             isMasked ? this.styler.traj_masked : this.styler.traj);
    //         // TODO start handler
    //         np1.callback = () => {};
    //
    //         let nSeg = lineByStyler(np0, np1, seg.speed,
    //             isMasked ? this.styler.traj_masked : this.styler.traj);
    //         newPath.push(nSeg);
    //     }
    //
    //     let seg = slicePath.afterPath[i];
    //     // assign final
    //     {
    //         let np0 = new DOM.SchedPoint(seg.p1.x, seg.p2.y, isMasked);
    //         let np1 = pointByStyler(seg.p2,
    //             isMasked ? this.styler.end_masked : this.styler.end);
    //         // TODO start handler
    //         np1.callback = () => {};
    //
    //         let nSeg = lineByStyler(np0, np1, seg.speed,
    //             isMasked ? this.styler.traj_masked : this.styler.traj);
    //         newPath.push(nSeg);
    //     }
    //
    //     // add post-final
    //     {
    //         let nRaw = buildToBorder(seg);
    //         let np0 = new DOM.SchedPoint(nRaw.p1.x, nRaw.p2.y, true);
    //         let np1 = new DOM.SchedPoint(nRaw.p1.x, nRaw.p2.y, true);
    //
    //         let nSeg = new DOM.SchedSegment(np0, np1, seg.speed, true);
    //         newPath.push(nSeg);
    //     }
    //
    //     this.path = newPath
    // }
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

class cropPathParams {
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