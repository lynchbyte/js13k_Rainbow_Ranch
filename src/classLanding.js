import { stage, hand, player } from './script.js';
import { addClouds } from './addStageComponents.js';

export class Landing {

    constructor(stage) {

        this.stage = stage;
        this.isMuted = false;

        this.createUI();
        this.vrQuery();

    }

    createUI() {

        //titile & wrappper boxes
        const pregameElements = [

            this.createEl('div', document.body, {
                id: 'title', className: 'text', textContent:
                    "Rainbow Ranch"
            }),

            ///box for buttons, game mode, about, etc
            this.createEl('div', document.body, { className: 'box' }),

            //box for buttons, exit, mute, etc
            this.createEl('div', document.body, { className: 'util' })

        ];

        pregameElements.forEach(el => el.classList.add('pregame-ui'));

        const [boxDiv, utilDiv] = [pregameElements[1], pregameElements[2]];

        [

            { parent: boxDiv, id: 'introB', left: '25%', text: 'Intro', event: () => this.togglePopup('introID', true) },
            { parent: boxDiv, id: 'startVR', left: '35%', fontSize: '30px', text: 'XR ?' },//, event: () => this.xrClicked()
            { parent: boxDiv, id: 'startDT', left: '65%', fontSize: '30px', text: 'Desktop', event: () => this.deskTopClicked() },
            { parent: boxDiv, id: 'aboutB', left: '75%', text: 'About', event: () => this.togglePopup('aboutID', true) },

            { parent: utilDiv, id: 'mute', left: '50%', fontSize: '15px', text: '🔉', event: this.toggleMute },
            { parent: utilDiv, id: 'exit', left: '50%', fontSize: '15px', text: 'Exit', event: () => window.location.reload() },

        ].forEach(cfg => {
            const btn = this.createEl('button', cfg.parent, { className: 'button', id: cfg.id, textContent: cfg.text });
            Object.assign(btn.style, { left: cfg.left, fontSize: cfg.fontSize || '' });
            if (cfg.event) btn.addEventListener('click', cfg.event);
        });

        this.createPopup('introID', 'Instructions', [
            'Step 1 - Do not let your unicorns date an ass!',
             'Step 2 - Manoeuvre dog to scare asses away.',
              'Step 3 - The llama is your friend.',
               'For Desktop - WASD to move, Q & E for looking.',
                'For VR - Use hand point, pinch and thumbs up to move and look around.',
                 'Have fun!'
        ]);

        this.createPopup('aboutID', 'About', [
            'Rainbow Ranch by Shauna Lynch for js13k comp. <a href="https://www.lynchbyte.com/index.html" target="_blank">lynchbyte</a>.',
            'Made with: <a href="https://threejs.org/" target="_blank">Three.js</a>',
            'Horse dating app idea, by youtuber <a href="https://www.youtube.com/@Fireship" target="_blank">Fireship</a>',
            'Intro tune by; <a href="https://ryanbmalm.com/voxby/" target="_blank">Voxby</a>.',
        ]);

    }

    createEl = (tag, parent, props = {}) => parent.appendChild(Object.assign(document.createElement(tag), props));

    createPopup(id, title, content) {
        const popup = this.createEl('div', document.body, { id, className: 'popUpClass pregame-ui' });
        this.createEl('h1', popup, { textContent: title });
        content.forEach(line => this.createEl('p', popup, { innerHTML: line }));
        this.createEl('button', popup, { className: 'buttonClose', textContent: '❌', onclick: () => this.togglePopup(id, false) });
    }

    togglePopup = (id, show) => document.getElementById(id).style.visibility = show ? 'visible' : 'hidden';

    removePreGameElements() {

        const elementsToRemove = document.querySelectorAll('.pregame-ui');

        // excluding the 'util' div and its children
        elementsToRemove.forEach(el => {

            if (!el.classList.contains('util') && !el.closest('.util')) {
                el.remove();

            }

        });

        const gone = stage.scene.getObjectByName("TitleText");

        if (gone) {
     
            stage.scene.remove(gone);

            // 2. Free up GPU memory (Crucial for js13k/VR transitions)
            gone.geometry.dispose();
            gone.material.dispose();
            if (gone.material.map) gone.material.map.dispose();
        }


    }

    toggleMute = () => {

        const audioCtx = this.stage.listener.context;
        const mute = document.getElementById('mute');
        const isMuted = audioCtx.state === 'suspended';
        (isMuted ? audioCtx.resume() : audioCtx.suspend()).then(() => {
            mute.textContent = isMuted ? '🔉' : '🔇';
        });

        //  const mute = document.getElementById('mute');

        // mute.textContent = this.isMuted ? '🔉' : '🔇';

        // //toggle the mute state
        // if (this.isMuted === true) {

        //     this.isMuted = false;
        //     audioCtx.resume();

        // } else {

        //     this.isMuted = true;
        //     audioCtx.suspend();

        // }

    }

    deskTopClicked = () => {

        this.removePreGameElements();

        addClouds(stage.scene);

        player.playerGameStarted = true; //update Movement is now active
        player.lerping = true;

        setTimeout(() => {

            player.lerping = false; // Stop lerping after 2 seconds
            player.addDolly();
            stage.timer.reset();

        }, 4000);

        player.addEventListenersDT();

    }

    xrClicked = () => {

        this.removePreGameElements();

        addClouds(stage.scene);

        player.gameModeDT = false; // Set game mode to VR

        player.addDolly();

        player.attachHands(hand);
        player.playerGameStarted = true; //update Movement is now active
        player.helperPlaneVR();

        stage.timer.reset();

        //for AR
        // this.stage.scene.background = null
        // app.renderer.alpha = true; // Enable transparency for AR mode

    }

    vrQuery() {

        let vrButton = document.getElementById('startVR');

        if (navigator.xr) {

            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {

                if (supported) {

                    vrButton.textContent = 'VR ✔️';
                    vrButton.addEventListener('click', () => {


                        navigator.xr.requestSession('immersive-vr', {
                            requiredFeatures: ['hand-tracking']
                        })

                            .then(session => {

                                onSessionStarted(session, this.stage);
                                this.session = session;

                                this.xrClicked();

                            })

                            .catch(err => {

                                console.log('Error starting session', err);

                                vrButton.textContent = 'No Hand-Tracking';
                        vrButton.style.fontSize = '15px';

                            });

                    });

                } else {

                    vrButton.textContent = 'VR ❌';

                }

            }).catch((error) => {

                console.error("Error checking VR support: ", error);
                vrButton.textContent = 'Error';

            });


        } else {

            vrButton.textContent = 'XR ❌';

        }

    }

}


async function onSessionStarted(session, stage) {

    stage.renderer.xr.setReferenceSpaceType('local');
    await stage.renderer.xr.setSession(session);

    console.log('XR session started:', stage.renderer);


}












