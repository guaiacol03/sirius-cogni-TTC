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
    _groupArray= [];

    constructor() {
        let elem = document.querySelector("svg g#svg_fixation_circle")
        this._groupArray.push(elem);
        elem = document.querySelector("svg g#svg_fixation_rect")
        this._groupArray.push(elem);
        elem = document.querySelector("svg g#svg_fixation_rhomb")
        this._groupArray.push(elem);
        elem = document.querySelector("svg g#svg_fixation_cross")
        this._groupArray.push(elem);

        this.Update();
    }

    Update(id) {
        this._groupArray.forEach((group) => {
            group.setAttribute("visibility", "hidden");
        })
        if (id != null) {
            this._groupArray[id].setAttribute("visibility", "visible");
        }
    }
}