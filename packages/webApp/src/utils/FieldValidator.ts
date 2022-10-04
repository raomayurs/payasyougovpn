export default class FormFieldValidator {

    static validateEmail(email: string): boolean {
        const format = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return (email.match(format) != null);
    }

    static validatePassword(password: string): boolean {
        const format = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*£#?&])[A-Za-z\d@$!%*#£?&]{8,}$/;
        return (password.match(format) != null);
    }

    static validatePhoneNumber(phoneNumber: string) {
        const format = /^[\+]?[0-9]{2,3}?[0-9]{10}$/;
        return phoneNumber.match(format);
    }

    static validatePostCode(postcode: string) {
        return (postcode.length >= 5 && postcode.length <= 10);
    }

    static validateDob(dob: Date) {
        const today = new Date();
        today.setHours(0,0,0,0);
        return dob.getTime() < today.getTime();
    }

    static validateCode(code:string) {
        return code.length === 6 && !isNaN(parseInt(code));
    }

    static validateMaxCapacity(capacity: string) {
        return !isNaN(parseInt(capacity)) && parseInt(capacity) > 1;
    }

    static validateTime(time:any) {
        if(!isNaN(parseInt(time))) {
            const hours = parseInt(time.slice(0,2));
            const min = parseInt(time.slice(2,4));
            return hours >= 0 && hours <= 24 && min >= 0 && min <= 60;
        }
        return false;
    }
}