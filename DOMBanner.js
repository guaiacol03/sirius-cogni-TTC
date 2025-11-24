import {waitForKey} from "./LoggedLaunchers.js";

export class DOMBannerHandler {
    blockBanner;
    blockText;
    timeBanner;
    minInput;
    secInput;
    iTexts

    constructor() {
        this.blockBanner = document.getElementById('svg_banner');
        this.blockText = document.getElementById('banner_text');
        this.timeBanner = document.getElementById('timeInputs');
        this.minInput = document.getElementById('minutesInput');
        this.secInput = document.getElementById('secondsInput');
        this.iTexts = document.getElementById('instructionTexts').contentDocument;
    }

    _getText(id) {
        return this.iTexts.getElementById(id).innerHTML
    }

    async waitWithBanner() {
        if (!this.timeBanner.classList.contains('hidden')) {
            this.timeBanner.classList.add('hidden')
        }

        this.blockText.innerHTML = this._getText('batch_space');

        this.blockBanner.classList.remove('hidden');
        await waitForKey();
        this.blockBanner.classList.add('hidden');
    }

    async endWithBanner(data) {
        if (this.timeBanner.classList.contains('hidden')) {
            this.timeBanner.classList.remove('hidden');
        }
        this.minInput.setAttribute('value',0);
        this.secInput.setAttribute('value', 0);

        this.blockText.innerHTML = eval('`' + this._getText('batch_end') + '`');

        this.blockBanner.classList.remove('hidden');
        for (let i = 0; i < 10; i++) {
            await waitForKey("Enter");
            let min = parseInt(this.minInput.value.trim());
            let sec = parseInt(this.secInput.value.trim());
            if (!(Number.isNaN(min) || Number.isNaN(sec))) {
                let tSec = min*60 + sec;
                if (tSec > 0) {
                    this.blockBanner.classList.add('hidden');
                    return tSec;
                } else {
                    alert("Оценка не может быть нулевой")
                }
            } else {
                alert("Введено неверное число")
            }
        }
    }

    async echoBanner(name) {
        if (!this.timeBanner.classList.contains('hidden')) {
            this.timeBanner.classList.add('hidden')
        }

        this.blockText.innerHTML = this._getText(name);

        this.blockBanner.classList.remove('hidden')
        await waitForKey(" ");
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
        elem = document.querySelector("svg g#svg_fixation_triangle")
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