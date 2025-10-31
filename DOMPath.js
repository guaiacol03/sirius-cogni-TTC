import * as Path from './Path.js'

export class SchedSegment extends Path.Segment {
    style;
    maskStyle;

    // should be invisible
    static #defaultStyle = 'svg_traj_hidden';
    static #defaultMaskStyle = 'svg_mask_traj'

    constructor(p1, p2, speed, masked) {
        super(p1, p2, speed);
        this.style = SchedSegment.#defaultStyle;
        this.maskStyle = masked ? SchedSegment.#defaultMaskStyle : null;
    }

    static withStyle(p1, p2, speed, style, maskStyle=null) {
        let ret = new SchedSegment(p1, p2, speed, false);
        ret.style = style;
        ret.maskStyle = maskStyle;
        return ret;
    }

    new(p1, p2, speed) {
        return Object.assign(new SchedSegment(p1, p2, speed, false), {
            style: this.style,
            maskStyle: this.maskStyle
        });
    }
}

export class SchedPoint extends Path.Point {
    callback = null;
    maskStyle;
    style;

    // should be invisible
    static #defaultStyle = 'svg_point_hidden+1';
    static #defaultMaskStyle = 'svg_mask_point+25'

    constructor(x, y, masked) {
        super(x, y);
        this.style = SchedPoint.#defaultStyle;
        this.maskStyle = masked ? SchedPoint.#defaultMaskStyle : null;
    }

    static withStyle(p, style, maskStyle=null) {
        let ret = new SchedPoint(p.x, p.y, false);
        ret.style = style;
        ret.maskStyle = maskStyle;
        return ret;
    }

    new(x, y) {
        return Object.assign(new SchedPoint(x, y, false), {
            style: this.style,
            maskStyle: this.maskStyle
        });
    }
}

export class DOMPathRenderer {
    path;
    points = [];
    levels = {};
    #bottomLayer;
    #topLayer;
    #trajLayer;

    constructor() {
        this.#bottomLayer = document.getElementById("svg_ball_bottom");
        this.#topLayer = document.getElementById("svg_ball_top");
        this.#trajLayer = document.getElementById("svg_traj");
    }

    Update(path) {
        // cleanup drawn elements
        this.#bottomLayer.innerHTML = '';
        this.#topLayer.innerHTML = '';
        this.#trajLayer.innerHTML = '';

        this.path = null;
        this.points = []
        this.levels = {};

        if (path) {
            this.path = path;
            this.points.push(path[0].p1);
            for (let i= 0; i < path.length; i++) {
                this.points.push(path[i].p2);
            }

            this.DrawTrajectory();
            this.DrawMask();
        }
    }

    DrawTrajectory() {
        for (let i = 0; i < this.path.length; i++) {
            let elem = this.path[i];
            let line = makeLine(elem.p1, elem.p2, elem.style)
            this.#trajLayer.appendChild(line);
        }

        for (let i = 0; i < this.points.length; i++) {
            let elem = this.points[i];
            //TODO declare radius
            let point = makePoint(elem, elem.style)
            this.#trajLayer.appendChild(point);
        }
    }

    DrawMask() {
        for (let i = 0; i < this.path.length; i++) {
            let seg = this.path[i];
            let pt = this.points[i+1];
            let res = []

            if (seg.maskStyle) {
                let maskLine = makeLine(seg.p1, seg.p2, seg.maskStyle);
                res.push(maskLine);
            }

            if (pt.maskStyle) {
                if (i === 0) {
                    let fMaskPoint = makePoint(pt, pt.style)
                    res.push(fMaskPoint);
                }
                let maskPoint = makePoint(pt, pt.style)
                res.push(maskPoint);
            }

            if (res.length > 0) {
                let group = document.createElementNS('http://www.w3.org/2000/svg',
                    'g');
                group.setAttribute('class', 'svg-ball-layer');
                group.setAttribute('layer', i.toString());

                res.forEach(elem => group.appendChild(elem));
                this.#bottomLayer.appendChild(group);
                this.levels[i] = group;
            }
        }
    }

    ArrangeLayer(layer) {
        for (let key in this.levels) {
            let value = this.levels[key];

            if (key > layer + 1) {
                if (value.parentElement.isEqualNode(this.#topLayer)) {
                    this.#bottomLayer.appendChild(value);
                }
            } else {
                if (value.parentElement.isEqualNode(this.#bottomLayer)) {
                    this.#topLayer.appendChild(value);
                }
            }
        }
    }
}

function makeLine(p1, p2, cl) {
    let line = document.createElementNS('http://www.w3.org/2000/svg',
        'line');
    line.setAttribute('x1', p1.x.toString());
    line.setAttribute('y1', p1.y.toString());
    line.setAttribute('x2', p2.x.toString());
    line.setAttribute('y2', p2.y.toString());
    line.setAttribute('class', cl);
    return line;
}

export function makePoint(p, cl) {
    let point = document.createElementNS('http://www.w3.org/2000/svg',
        'circle');
    point.setAttribute('cx', p.x.toString());
    point.setAttribute('cy', p.y.toString());
    let spl = cl.split('+');
    point.setAttribute('r', spl[1]);
    point.setAttribute('class', spl[0]);
    return point;
}