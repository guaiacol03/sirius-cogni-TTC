import * as Path from "./Path.js"
import * as DOM from "./DOMPath.js"

export class DOMBallAnimator {
    _ball;
    _midLayer;
    style;

    static #defaultPoint = new Path.Point(350, 200);
    static #defaultStyle = 'floating_ball+10';

    constructor() {
        this._midLayer = document.getElementById("svg_ball_middle");

        this._ball = DOM.makePoint(
            DOMBallAnimator.#defaultPoint,
            DOMBallAnimator.#defaultStyle);
        this._midLayer.appendChild(this._ball);

        this.style = DOMBallAnimator.#defaultStyle;
    }

    Update(point) {
        if (point) {
            this._ball.setAttribute("cx", point.x);
            this._ball.setAttribute("cy", point.y);
        }
        let spl = this.style.split('+')
        this._ball.setAttribute("r", spl[1]);
        this._ball.setAttribute("class", spl[0]);
    }
}
