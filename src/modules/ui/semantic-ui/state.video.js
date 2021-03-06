export class VideoState { 
    constructor(playerSection, data){
        this.playerSection = playerSection;
        this.data = data;
    }

    get iPhoneInlineClasses(){
        let {isIphone = false} = this.data;

        return isIphone ? 'iphone-inline' : ''; 
    }

    get defaultHeaderClasses(){
        return 'ui header';
    }
    
    get html() {   
        let {playerSection, data, iPhoneInlineClasses} = this;
        let {header = {}, footer = {}, section = {}} = data;
        let {classes : headerClasses = '', html: headerHTML = ``} = header;
        let {classes : sectionClasses = '' } = section;
        let {classes : footerClasses = '', html : footerHTML = ''} = footer;
        
        return `
            <section class="ui container ${sectionClasses} ${iPhoneInlineClasses}" id="${data.id}">
                <header class="${headerClasses} ${this.defaultHeaderClasses}">${headerHTML}</header>
                ${playerSection}
                <footer class="${footerClasses}">${footerHTML}</footer>
            </section>`;
    }
};