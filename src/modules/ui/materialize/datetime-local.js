import { DatetimeLocal as BasicDatetimeLocal  } from '../basic/datetime-local.js';
import { ErrorMessages } from "./messages.js";

export class DatetimeLocal extends BasicDatetimeLocal{
    constructor(inputObj) {
        super(inputObj, ErrorMessages);  
    } 
    
    get uiClasses() {
        return 'datepicker'
    }

    get labelClasses(){
        return 'active';
    }
}