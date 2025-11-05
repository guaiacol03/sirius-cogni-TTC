import {waitForSpace} from "./LoggedLaunchers.js";

export class DOMBannerHandler {
    blockBanner;

    constructor() {
        this.blockBanner = document.getElementById('svg_banner');
    }

    async waitWithBanner() {
        this.blockBanner.classList.remove('hidden');
        await waitForSpace();
        this.blockBanner.classList.add('hidden');
    }
}

export class DOMFixationHandler {
    _DOMPoint
    constructor() {
        this._DOMPoint = document.getElementById('svg-fixation');
    }

    Update(shown) {
        if (shown) {
            this._DOMPoint.setAttribute("class", "svg_fixation");
        } else {
            this._DOMPoint.setAttribute("class", "svg_point_hidden");
        }
    }
}