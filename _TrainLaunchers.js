import * as Lib from "./TrajLibrary.js"
import * as Path from "./Path.js"
import {DOMBallAnimator} from "./DOMBall.js";
import {DOMPathRenderer} from "./DOMPath.js";
import {NormalAnimator} from "./NormalAnimator.js";
import {_BackwardAnimator} from "./_BackwardAnimator.js";
import {calcHalfMask, waitForSpace} from "./LoggedLaunchers.js";
import {ShuffleArray} from "./RandomRunner.js"


// launcher only for training runs - they are not logged
export class TrainLauncher {
    _ballHandler;
    _pathHandler;
    _trajectories;
    _instrPopup;
    _instrDoc;
    _blockBanner;

    constructor() {
        this._pathHandler = new DOMPathRenderer();
        this._pathHandler.Update();
        this._ballHandler = new DOMBallAnimator();
        this._instrPopup = document.getElementById('instructionsBox');
        this._instrDoc = document.getElementById('instructionTexts').contentDocument;
        this._blockBanner = document.getElementById('svg_banner');
        this.setInstruction();

        // TODO separate testing trajectories
        this._trajectories = [...Lib.MED_S1.LoadEntries()].slice(0, 3);
    }

    setInstruction(id) {
        if (!id) {
            this._instrPopup.innerHTML = '';
            this._instrPopup.classList.add('hidden');
            return;
        }

        let elHtml;
        try {
            elHtml = this._instrDoc.getElementById(id).innerHTML;
        } catch (e) {
            console.warn(e);
            this._instrPopup.innerHTML = '';
            this._instrPopup.classList.add('hidden');
            return;
        }

        this._instrPopup.innerHTML = elHtml;
        this._instrPopup.classList.remove('hidden');
    }

    async _runNormal(tries) {
        let anim = new NormalAnimator(this._pathHandler, this._ballHandler);
        let path = this._trajectories[0];
        let mask = calcHalfMask(path);
        anim.Configure(path, mask);
        anim.showResult = true;
        anim.Load();

        this.setInstruction("instruct_normal_waiting");
        await waitForSpace();
        this.setInstruction("instruct_normal_running");
        await anim.Play();

        this.setInstruction("instruct_normal_inspect");
        await waitForSpace();

        this.setInstruction("instruct_repeat");
        for (let i = 1; i < this._trajectories.length; i++) {
            path = this._trajectories[i];
            anim = new NormalAnimator(this._pathHandler, this._ballHandler);
            mask = calcHalfMask(path);
            anim.Configure(path, mask);
            anim.showResult = true;
            anim.Load();

            await anim.Play();
            await new Promise(res => setTimeout(res, 900));
            await this.waitWithBanner();
        }
        this.setInstruction("instruct_finished");
        await this.waitWithBanner();
    }

    async _runUnmasked() {
        let anim = new NormalAnimator(this._pathHandler, this._ballHandler);
        let path = this._trajectories[0];
        anim.Configure(path, null);
        anim.Load();

        this.setInstruction("instruct_nomask_waiting");
        await waitForSpace();
        this.setInstruction("instruct_nomask_running");
        await anim.Play();

        this.setInstruction("instruct_nomask_inspect");
        await waitForSpace();

        this.setInstruction("instruct_repeat");
        for (let i = 1; i < this._trajectories.length; i++) {
            path = this._trajectories[i];
            anim = new NormalAnimator(this._pathHandler, this._ballHandler);
            anim.Configure(path, null);
            anim.showResult = true;
            anim.Load();

            await anim.Play();
            await new Promise(res => setTimeout(res, 900));
            await this.waitWithBanner();
        }
        this.setInstruction("instruct_finished");
        await this.waitWithBanner();
    }

    async _runBackward() {
        let anim = new _BackwardAnimator(this._pathHandler, this._ballHandler);
        let path = this._trajectories[0];
        anim.Configure(path);
        anim.LoadForward();

        this.setInstruction("instruct_backward_waiting_fwd");
        await waitForSpace();
        this.setInstruction("instruct_backward_running_fwd");
        await anim.PlayForward();
        this.setInstruction("instruct_backward_inspect_fwd");

        await waitForSpace();
        anim.LoadBackward();
        this.setInstruction("instruct_backward_running_bwd");
        await anim.PlayBackward();

        this.setInstruction("instruct_backward_inspect_bwd");
        await waitForSpace();

        this.setInstruction("instruct_repeat");
        for (let i = 1; i < this._trajectories.length; i++) {
            path = this._trajectories[i];
            anim = new _BackwardAnimator(this._pathHandler, this._ballHandler);
            anim.Configure(path);

            anim.LoadForward();
            await anim.PlayForward();
            await new Promise(res => setTimeout(res, 900));

            anim.LoadBackward();
            await anim.PlayBackward();

            await new Promise(res => setTimeout(res, 900));
            await this.waitWithBanner();
        }
        this.setInstruction("instruct_finished");
        await this.waitWithBanner();
    }

    async runAll() {
        this.setInstruction("instruct_welcome");
        await waitForSpace();

        await this._runUnmasked();
        await this._runNormal();
        await this._runBackward();
    }

    async waitWithBanner() {
        this._blockBanner.classList.remove('hidden');
        await waitForSpace();
        this._blockBanner.classList.add('hidden');
    }
}