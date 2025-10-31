import * as Path from "./Path.js";
import * as Anim from "./PathAnimation.js";

export function ExportNormalAnimator (anim) {
    let res = {};
    let anmH = anim._animHandler;

    let nAnim = new Anim.PathAnimState(anim.srcPath)
    nAnim.Start(anmH.startTimestamp);
    nAnim.AdvanceState(anmH.lastTimestamp);

    res.endPos = {segment: nAnim.segment, position: nAnim.position};
    res.endDist = Path.PosToDistance(nAnim.path, nAnim)
    return res;
}