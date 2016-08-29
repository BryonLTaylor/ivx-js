import createFactoryFunction from '../utilities/create-factory-function.js';
import HtmlStateController from '../controllers/state.html.js';
import AudioEventNames from "../../constants/audio.events.js";

class HtmlState {
    constructor($state, $http, $compile, $sce, $timeout, iVXjs, iVXjsActions, iVXjsAudio, iVXjsBus) {
        this.template = this.templateHTML;
        this.restrict = 'E';
        this.scope = {}
        this.controller = HtmlStateController;
        this.controllerAs = 'vm';
        this.link = function ($scope, iElm, iAttrs, controller) {
            let {id, html, templateUrl, onCompile = [], audio} = $state.current.data;
            let audioEventNames = new AudioEventNames();
          
            if (templateUrl) {
                let safeTemplateUrl = $sce.getTrustedResourceUrl(templateUrl);

                controller.safeTemplateUrl = safeTemplateUrl

                iElm.find('div').html(`<div ng-include="vm.safeTemplateUrl"></div>`);
            } else {
                iElm.find('div').html(html);
            }
            
            $scope.experience = iVXjs.experience.data;
            
            $timeout(() => {
                iVXjsActions.resolveActions(onCompile, () => {
                    if (audio && audio.src) {
                        iVXjsBus.emit(audioEventNames.PLAY);
                    }

                })
            }, 1);
            $compile(iElm.contents())($scope);
        }
    }

    get templateHTML() {
        return `<div id="{{vm.id}}"></div>`;
    };
}

HtmlState.$inject = ['$state', '$http', '$compile', '$sce', '$timeout', 'iVXjs', 'ivxjs.actions', 'ivxjs.modules.audio', 'ivxjs.bus'];

export default createFactoryFunction(HtmlState);