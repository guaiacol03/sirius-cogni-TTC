import * as Path from "./Path.js"
import * as DOM from "./DOMPath.js"

export class DOMBallAnimator {
    #ball;
    #midLayer;
    style;

    static #defaultPoint = new Path.Point(0, 0);
    static #defaultRadius = 20;
    static #defaultStyle = 'floating_ball';

    constructor() {
        this.#midLayer = document.getElementById("svg_ball_middle");

        this.#ball = DOM.makePoint(
            DOMBallAnimator.#defaultPoint,
            DOMBallAnimator.#defaultRadius,
            DOMBallAnimator.#defaultStyle);
        this.#midLayer.appendChild(this.#ball);

        this.style = DOMBallAnimator.#defaultStyle;
    }

    Update(point) {
        if (point) {
            this.#ball.setAttribute("cx", point.x);
            this.#ball.setAttribute("cy", point.y);
        }
        this.#ball.setAttribute("class", this.style);
    }
}
