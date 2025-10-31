import * as Path from "./Path.js"
import * as DOM from "./DOMPath.js"

export class DOMBallAnimator {
    #ball;
    #midLayer;
    style;

    static #defaultPoint = new Path.Point(0, 0);
    static #defaultStyle = 'floating_ball+10';

    constructor() {
        this.#midLayer = document.getElementById("svg_ball_middle");

        this.#ball = DOM.makePoint(
            DOMBallAnimator.#defaultPoint,
            DOMBallAnimator.#defaultStyle);
        this.#midLayer.appendChild(this.#ball);

        this.style = DOMBallAnimator.#defaultStyle;
    }

    Update(point) {
        if (point) {
            this.#ball.setAttribute("cx", point.x);
            this.#ball.setAttribute("cy", point.y);
        }
        let spl = this.style.split('+')
        this.#ball.setAttribute("r", spl[1]);
        this.#ball.setAttribute("class", spl[0]);
    }
}
