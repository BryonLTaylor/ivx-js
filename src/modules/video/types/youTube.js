import VideoEventNames from "../../../constants/video.events.js";
import VideoClassNames from "../../../constants/video.classes.js";
import { TypeValidator } from "../../../utilities/type-parsers.js";
import Element from "../../../utilities/element.js";
import VideoService from "./video";

let typeValidator = new TypeValidator();

export class YouTube {
    constructor(container, settings, stateData, iVXjsLog) {
        const containerElement = new Element(container);

        this._settings = settings;
        this._stateData = stateData;
        this.intervals = [];
        this.videoEventNames = new VideoEventNames();
        this.iVXjsLog = iVXjsLog;
        this.playerId = settings.playerId;
        this.currentVolume = 0.6;
        this.videoService = new VideoService();

        Object.assign(this, {
            videoClassNames: new VideoClassNames(),
            container: containerElement
        });

        containerElement.html(this.html);
    }

    createPlayer() {
        let { height = 'inherit', width = 'inherit', id, controls, playerId } = this._settings;
        let hasControls = this.videoService.showControls(controls) ? 1 : 0;

        this.player = new YT.Player(this.playerId, {
            height: height,
            width: width,
            videoId: id,
            playerVars: {
                controls: hasControls,
                showinfo: 0,
                autohide: 1
            }
        });

        this.player.id = playerId;


    }

    dispose(iVXjsBus) {
        let { videoEventNames } = this;
        let self = this;
        let eventNameMap = {
            play: videoEventNames.PLAY,
            pause: videoEventNames.PAUSE,
            seek: videoEventNames.SEEK,
            duration: videoEventNames.GET_DURATION,
            volume: videoEventNames.SET_VOLUME,
            playing: videoEventNames.PLAYING,
            paused: videoEventNames.PAUSED,
            ended: videoEventNames.ENDED,
            mute: videoEventNames.MUTE,
            unmute: videoEventNames.UNMUTE
        };
        let eventsToDispose = Object.keys(eventNameMap);

        clearInterval(this.timeUpdateId);
        clearInterval(this.mutedIntervalId);

        eventsToDispose.forEach((eventNameToDispose, index) => {
            if (!self[`${eventNameToDispose}OnEvent`]) return;

            iVXjsBus.removeListener(eventNameMap[eventNameToDispose], self[`${eventNameToDispose}OnEvent`])
        });
    }

    addEventListeners(iVXjsBus, settings = {}, iVXjsActions) {
        let { _stateData: stateData, player, videoEventNames, playerId, videoClassNames } = this;
        let self = this;
        let timeUpdateId;
        let numberofTimeupdates = 0;

        player.addEventListener('onError', (event) => {
            let messages = {
                2: `The request contains an invalid parameter value. For example, this error occurs if you specify a video ID that does not have 11 characters, or if the video ID contains invalid characters, such as exclamation points or asterisks.`,
                5: `The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.`,
                100: `The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.`,
                101: `The owner of the requested video does not allow it to be played in embedded players.`,
                150: `The video requested was not found. This error occurs when a video has been removed (for any reason) or has been marked as private.`
            };
            let errorObj = {
                message: messages[event.data]
            };

            self.iVXjsLog.error(errorObj, "VIDEO");
        })

        player.addEventListener('onStateChange',
            function onStateChange() {
                const { onVideoPlay = [], onVideoPause = [] } = settings;
                switch (player.getPlayerState()) {
                    case 0:
                        iVXjsBus.emit(videoEventNames.ENDED, player, stateData);
                        break;
                    case 1:
                        player.paused = false;
                        iVXjsActions.resolveActions(onVideoPlay, () => {

                        })
                        iVXjsBus.emit(videoEventNames.PLAYING, player, stateData);
                        self.container.removeClass(videoClassNames.PAUSED);
                        self.container.removeClass(videoClassNames.SEEKING);
                        self.container.addClass(videoClassNames.PLAYING);
                        break;
                    case 2:
                        player.paused = true;
                        iVXjsActions.resolveActions(onVideoPause, () => {

                        })
                        self.container.removeClass(videoClassNames.PLAYING);
                        self.container.addClass(videoClassNames.PAUSED);
                        iVXjsBus.emit(videoEventNames.PAUSED, player, stateData);
                        break;
                    case 3:
                        iVXjsBus.emit(videoEventNames.BUFFERING, player, stateData);
                        self.container.addClass(videoClassNames.SEEKING);
                        break;
                }
            });

        player.addEventListener('onReady',
            function onYouTubeOnReady() {
                self.playOnEvent = iVXjsBus.on(videoEventNames.PLAY, playOnEvent);
                self.pauseOnEvent = iVXjsBus.on(videoEventNames.PAUSE, pauseOnEvent);
                self.muteOnEvent = iVXjsBus.on(videoEventNames.MUTE, muteOnEvent);
                self.unmuteOnEvent = iVXjsBus.on(videoEventNames.UNMUTE, unmuteOnEvent);
                self.volumeOnEvent = iVXjsBus.on(videoEventNames.SET_VOLUME, volumeOnEvent);
                self.durationOnEvent = iVXjsBus.on(videoEventNames.GET_DURATION, durationOnEvent);
                self.seekOnEvent = iVXjsBus.on(videoEventNames.SEEK, seekOnEvent);
                self.pausedOnEvent = iVXjsBus.on(videoEventNames.PAUSED, pausedOnEvent);
                self.endedOnEvent = iVXjsBus.on(videoEventNames.ENDED, endedOnEvent);
                self.playingOnEvent = iVXjsBus.on(videoEventNames.PLAYING, playingOnEvent);
                self.playOnEvent = typeof self.playOnEvent === 'function' ? self.playOnEvent : playOnEvent;
                self.pauseOnEvent = typeof self.pauseOnEvent === 'function' ? self.pauseOnEvent : pauseOnEvent;
                self.seekOnEvent = typeof self.seekOnEvent === 'function' ? self.seekOnEvent : seekOnEvent;
                self.durationOnEvent = typeof self.durationOnEvent === 'function' ? self.durationOnEvent : durationOnEvent;
                self.volumeOnEvent = typeof self.volumeOnEvent === 'function' ? self.volumeOnEvent : volumeOnEvent;
                self.pausedOnEvent = typeof self.pausedOnEvent === 'function' ? self.pausedOnEvent : pausedOnEvent;
                self.endedOnEvent = typeof self.endedOnEvent === 'function' ? self.endedOnEvent : endedOnEvent;
                self.playingOnEvent = typeof self.playingOnEvent === 'function' ? self.playingOnEvent : playingOnEvent;

                // Sets the duration for the player
                player.duration = player.getDuration();
                iVXjsBus.emit(videoEventNames.READY, player, self.stateData);

                self.container.addClass(videoClassNames.PAUSED);
                self._setMuted(iVXjsBus, settings, iVXjsActions);
            });


        function playOnEvent(args = {}) {
            const { playerId } = args;

            if (!playerId || playerId === self.playerId) playVideo();

            function playVideo() {
                player.playVideo();
                clearInterval(self.timeUpdateId);
            }
        }

        function pauseOnEvent(args = {}) {
            const { playerId } = args;

            if (!playerId || playerId === self.playerId) pauseVideo();

            function pauseVideo() {
                player.pauseVideo();
                clearInterval(self.timeUpdateId);
            }
        }

        function durationOnEvent(args = {}) {
            const { playerId } = args;

            if (playerId === self.playerId) setDuration();

            function setDuration() {
                iVXjsBus.emit(videoEventNames.SET_DURATION, {
                    playerId,
                    duration: player.getDuration()
                });
            }
        }

        function volumeOnEvent(args = {}) {
            const { playerId, volume } = args;

            if (!playerId || playerId === self.playerId) setVolume();

            function setVolume() {
                self.currentVolume = volume;
                player.setVolume(volume * 100);
            }
        }

        function muteOnEvent(args = {}) {
            const { onVideoMute } = settings;
            const { playerId } = args;

            if (!playerId || playerId === self.playerId) setMute();

            function setMute() {
                player.mute();
            }
        }

        function unmuteOnEvent(args = {}) {
            const { onVideoUnmute } = settings;
            const { playerId } = args;

            if (!playerId || playerId === self.playerId) setUnmute();

            function setUnmute() {
                player.unMute();
            }
        }

        function playingOnEvent(player) {
            if (player.id === self.playerId) {
                player.currentTime = player.getCurrentTime();

                iVXjsBus.emit(videoEventNames.TIME_UPDATE, player);

                let currentNumber = numberofTimeupdates;

                self.timeUpdateId = setInterval(() => {
                    player.currentTime = player.getCurrentTime();

                    iVXjsBus.emit(videoEventNames.TIME_UPDATE, player, stateData);
                }, 50);
            }
        }

        function seekOnEvent(args = {}) {
            clearInterval(self.timeUpdateId);

            const { playerId, currentTime } = args;

            if (!playerId || playerId === self.playerId) seek()

            function seek() {
                player.seekTo(currentTime);
                clearInterval(self.timeUpdateId);
            }
        }

        function pausedOnEvent() {
            clearInterval(self.timeUpdateId);
        }

        function endedOnEvent() {
            clearInterval(self.timeUpdateId);
        }
    }

    _setMuted(iVXjsBus, settings = {}, iVXjsActions) {
        const { player, container, videoClassNames } = this;
        const { onVideoMute = [], onVideoUnmute = [] } = settings;
        let muted = player.isMuted();

        this.mutedIntervalId = setInterval(() => {
            const changed = muted !== player.isMuted()
            if (changed && player.isMuted()) {
                container.removeClass(videoClassNames.UNMUTED);
                container.addClass(videoClassNames.MUTED);
                iVXjsActions.resolveActions(onVideoMute, () => {

                })
                muted = true;
                return;
            }
            if (changed && !player.isMuted()) {
                container.removeClass(videoClassNames.MUTED);
                container.addClass(videoClassNames.UNMUTED);
                iVXjsActions.resolveActions(onVideoUnmute, () => {

                })
                muted = false;
                return;
            }
        }, 50);
    }

    get html() {
        const { classes = "", personalizationsHTML } = this._settings;

        return `<div id="${this.playerId}" class='youtube-player ${classes}'></div>
        <div class="ivx-video-personalization-section">
            ${personalizationsHTML}
        </div>
        `;
    }
}