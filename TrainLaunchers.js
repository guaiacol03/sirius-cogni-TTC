import * as Path from "./Path.js";
import {NormalAnimator} from "./NormalAnimator.js";
import {waitForKey} from "./LoggedLaunchers.js";
import {convTrajectory} from "./StaticRunner.js";

export class TrainLauncher {
    trajs

    constructor(meta) {
        Object.assign(this, meta);

        let library = JSON.parse(document.getElementById("trajJsonLib").
            contentDocument.getElementById("traj_testing").textContent);

        for (let k in library) {
            let bat = library[k];
            for (let i = 0; i < bat.length; i++) {
                let trj = bat[i];
                let nObj = {
                    segments: convTrajectory(trj),
                    mask: {
                        countFrom: 0, countTo: -1, distance: trj.mask, invert: false
                    }
                }
                bat[i] = nObj;
            }
            library[k] = bat;
        }

        this.trajs = library;
    }

    async TrainUnmasked() {
        await this.bannerHandler.echoBanner('instruct_nomask');

        for (let i = 0; i < this.trajs.unmasked.length; i++) {
            let path = this.trajs.unmasked[i];
            let player = new NormalAnimator(this.pathHandler, this.ballHandler);
            player.Configure(path.segments, null);

            this.fixHandler.Update(4)
            await TrainLauncher._play(player);
            await this.bannerHandler.waitWithBanner();
        }
    }

    async TrainNormal() {
        await this.bannerHandler.echoBanner('instruct_nomask');

        for (let i = 0; i < this.trajs.normal.length; i++) {
            let path = this.trajs.normal[i];
            let player = new NormalAnimator(this.pathHandler, this.ballHandler);
            player.Configure(path.segments, path.mask);
            player.showResult = true;

            this.fixHandler.Update(1)
            await TrainLauncher._play(player);
            await this.bannerHandler.waitWithBanner();
        }
    }

    async TrainBackward() {
        await this.bannerHandler.echoBanner('instruct_backward');

        for (let i = 0; i < this.trajs.backward.length; i++) {
            let path = this.trajs.backward[i];
            let player = new NormalAnimator(this.pathHandler, this.ballHandler);
            player.Configure(path.segments, null);
            player.stopAtEnd = true;

            this.fixHandler.Update(2)
            await TrainLauncher._play(player);

            this.ballHandler.Update();
            this.pathHandler.Update();

            this.fixHandler.Update(0)
            await waitForKey(" ")
            await this.bannerHandler.waitWithBanner();
        }
    }

    static async _play(player) {
        player._ballHandler.Update();
        player._pathHandler.Update()
        await new Promise(resolve => setTimeout(resolve, 900));

        player._ballHandler.style = "floating_ball+10";
        player.Load();
        await player.Play();
        await new Promise(resolve => setTimeout(resolve, 900));
    }
}

