import { Style } from "./style";
import { ErrorMessages } from "./messages.js";
import { AttributeTags } from "../utilities/attributes.js";

let style = new Style();

export class Options {
    constructor(inputObj, errorMessages = ErrorMessages) {
        let {input, defaultDisplay = '', settings = {}, tags = '', errors = {}} = inputObj;

        this.tags = tags;
        this.input = input;
        this.defaultDisplay = defaultDisplay;
        this.errors = errors;
        this.settings = settings;
        this.errorMessages = errorMessages;
        this.attributeTags = AttributeTags;
    }

    get uiClasses() {
        return ''
    }

    get uiAttributes() {
        return ''
    }

    get beforeClasses(){
        return 'ivx-input-before ivx-input-before-options';
    }

    get afterClasses(){
        return 'ivx-input-after ivx-input-after-options';
    }

    get html() {
        let {tags, input, defaultDisplay, errors, settings, uiClasses, uiAttributes, beforeClasses : defaultBeforeClasses, afterClasses : defaultAfterClasses} = this;
        let {id, name, options, label = '', labelHTML, beforeHtml : beforeSettings = {}, afterHtml : afterSettings = {}} = input;
        let {input: inputSettings = {}, showLabel = true} = settings;
        let {classes = ''} = inputSettings;

        const {html : beforeHtml = "", classes : beforeClasses = ""} = beforeSettings;
        const {html : afterHtml = "", classes : afterClasses = ""} = afterSettings;

        classes = `${classes} ${uiClasses}`;

        let {messages: errorMessages = [], attributes: errorAttributes = '', nonValidate = [], tags: errorTags = ''} = errors;
        let defaultOptionTag = `<option value="">Select an option...</option>`;
        let errorHTML = new this.errorMessages(errorMessages).html;
        let nonValidateAttributesHTML = new this.attributeTags(errorAttributes, nonValidate).html;

        nonValidateAttributesHTML = `${nonValidateAttributesHTML} ${uiAttributes}`;

        if (errorAttributes.required || (defaultDisplay && defaultDisplay.length >= 0)) {
            defaultOptionTag = defaultDisplay ?
                `<option value="">${defaultDisplay}</option>` :
                defaultOptionTag;
        }

        if (labelHTML) label = labelHTML;

        let optionsHTML = options.reduce((optionHTML, option) => {
            return `${optionHTML}
            <option value="${option.value}">${option.display}</option>`
        }, '')

        let inputHTML = ` 
             <div class="${beforeClasses} ${defaultBeforeClasses}">${beforeHtml}</div>
             <label class="ivx-input-label ivx-input-label-options" for="${id}">${label}</label>             
               <select class="${classes} ivx-input ivx-input-options"  id="${id}" name="${name}"${nonValidateAttributesHTML} ${errorTags} ${tags}>
                  ${defaultOptionTag}
                  ${optionsHTML}
               </select>
               ${errorHTML}
               <div class="${afterClasses} ${defaultAfterClasses}">${afterHtml}</div>
        `;

        return `${inputHTML}`;
    }
}