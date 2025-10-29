import * as Path from "./Path.js";

export class PathAnimState extends Path.PathPos {
    path;
    lastTimestamp;
    startTimestamp;
    endTimestamp;
    currentStatus;

    constructor(path) {
        super(0, 0);
        this.path = Path.ClonePath(path);
        this.currentStatus = "created"
    }

    AdvanceState(time) {
        let dtime = time - this.lastTimestamp;

        let currSegmentNum = this.segment;
        let currSegment = this.path[currSegmentNum];

        let remainsInSegment = currSegment.distance - this.position;
        let strideInSegment = currSegment.speed * dtime;

        if (strideInSegment >= remainsInSegment) {
            let strideTime = remainsInSegment / currSegment.speed;
            this.lastTimestamp += strideTime;
            if (currSegmentNum < this.path.length - 1) {
                // go to next segment
                this.segment += 1;
                this.position = 0;
                this.AdvanceState(time)
            } else {
                // end animation
                this.position += remainsInSegment;
                this.endTimestamp = time;
                this.currentStatus = "finished";
            }
        } else {
            // advance within segment
            this.lastTimestamp = time;
            this.position += strideInSegment;
        }
    }

    Start(time) {
        this.startTimestamp = time;
        this.lastTimestamp = time;
        this.currentStatus = "running";
    }

    GetPoint() {
        return Path.GetPathPoint(this.path, this);
    }
}

class BallPathAnimParams {
    countFrom;
    countTo;
    distance;
    invert;
}

export function MakePathAnim(path, params) {
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

    let resultPath = Path.SplitPath(srcCropPath, splitPt);
    return resultPath.beforePath;
}

let demo_path = [
    new Path.Segment(
        new Path.Point(0, 0),
        new Path.Point(0, 75),
        100
    ),
    new Path.Segment(
        new Path.Point(0, 75),
        new Path.Point(0, 100),
        100
    ),
    new Path.Segment(
        new Path.Point(0, 100),
        new Path.Point(0, 200),
        100
    )
]

let pt = MakePathAnim(demo_path, {
    countFrom: 0,
    countTo: -1,
    distance: 50,
    invert: true
})

let anm = new PathAnimState(pt);
anm.Start(0) // start animation at timestamp
anm.AdvanceState(0.85) // advance state towards timestamp
let ptx = anm.GetPoint() // get point coordinates for anim state
console.log(ptx)