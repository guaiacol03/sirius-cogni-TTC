export class PathPos {
    segment;
    position;
    constructor(seg, pos) {
        this.segment = seg;
        this.position = pos;
    }
}

export class Point {
    x;
    y;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    // override to retain data in subclasses
    new(x, y) {
        return new Point(x, y)
    }
}

export class Segment {
    p1;
    p2;
    speed;

    get distance() {
        return Math.sqrt(Math.pow(this.p2.x - this.p1.x, 2) + Math.pow(this.p2.y - this.p1.y, 2));
    }

    constructor(p1, p2, speed) {
        this.p1 = p1;
        this.p2 = p2;
        this.speed = speed;
    }
    // override to retain data in subclasses
    new(p1, p2, speed) {
        return new Segment(p1, p2, speed)
    }
}

export function InvertPath(path) {
    /*
    there is an easier option of "arr.reverse()", where we don't need XY data
     */
    let newPath = []
    for (let i = path.length - 1; i >= 0; i--) {
        let seg = path[i];
        let newSegment = seg.new(seg.p2, seg.p1, seg.speed);
        newPath.push(newSegment);
    }
    return newPath;
}

export function ClonePath(path) {
    let newPath = [];
    for (let i = 0; i < path.length; i++) {
        let seg = path[i];
        newPath.push(seg.new(seg.p1, seg.p2, seg.speed));
    }
    return newPath;
}

export function SplitPath(path, pos) {
    let beforePath = path.slice(0, pos.segment);
    let afterPath = path.splice(pos.segment + 1);

    let splSegment = path[pos.segment];
    // split segment
    if (pos.position === 0) {
        afterPath.unshift(splSegment)
    } else if (pos.position >= splSegment.distance) {
        beforePath.push(splSegment)
    } else {
        let splPoint = GetPathPoint(path, pos);
        let beforeSeg = splSegment.new(
            splSegment.p1,
            splPoint,
            splSegment.speed
        );
        beforePath.push(beforeSeg);

        let afterSeg = splSegment.new(
            splPoint,
            splSegment.p2,
            splSegment.speed
        );
        afterPath.unshift(afterSeg)
    }

    return {beforePath, afterPath}
}

export function InvertPos(srcPath, pos) {
    let invSegmentNum = srcPath.length - pos.segment - 1;
    let invSegment = srcPath[invSegmentNum];

    let invPosition = invSegment.distance - pos.position;
    return new PathPos(invSegmentNum, invPosition);
}

export function FindByDistance(path, distance) {
    let leftDistance = distance;
    let currSegmentNum;
    let overflow = true;

    for (currSegmentNum = 0; currSegmentNum < path.length; currSegmentNum++) {
        let currSegment = path[currSegmentNum];
        let csd = currSegment.distance;
        if (leftDistance > currSegment.distance) {
            leftDistance -= currSegment.distance;
        } else {
            overflow = false;
            break
        }
    }

    let pp = new PathPos(currSegmentNum, leftDistance);
    pp.overflow = overflow;
    return pp;
}

export function PosToDistance(path, pos) {
    let distance = 0;
    for (let i = 0; i < pos.segment; i++) {
        distance += path[i].distance;
    }
    distance += pos.position;
    return distance;
}

export function GetPathPoint(path, pos) {
    let curSegment = path[pos.segment];

    let strideFrac = pos.position / curSegment.distance;
    let sx = curSegment.p2.x - curSegment.p1.x;
    let x = curSegment.p1.x + (sx * strideFrac);
    let sy = curSegment.p2.y - curSegment.p1.y;
    let y = curSegment.p1.y + (sy * strideFrac);

    return new Point(x, y)
}
