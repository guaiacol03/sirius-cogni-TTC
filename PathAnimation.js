import * as Path from "./Path.js";

export class PathAnimState extends Path.PathPos {
    path;
    lastTimestamp = 0; // to reset when not started yet
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