import React from "react";
import CodeConfirmationPopup from "../components/CodeConfirmationPopup";
import { FormTable, TextRow } from "../components/FormInput";
import Layout from "../components/Layout";
import { withRouter } from "../components/WithRouter";
import styles from "../styles/form-input.module.css";
import { CognitoClient } from "../utils/CognitoClient";
import FieldValidator from "../utils/FieldValidator";

export type RegisterState = {
    name: string,
    email: string,
    password: string,
    phoneNumber: string,
    code: string,
    registrationError?: string,
    isInputInvalid: {
        name: boolean,
        email: boolean,
        password: boolean,
        phoneNumber: boolean
    },
    isLoading: boolean,
    isSigningIn: boolean,
    isButtonDisabled: boolean,
    isCodeSubmitButtonDisabled: boolean,
    accessToken: string
};

export type RegisterProps = {
    cognitoClient: CognitoClient;
    navigate: any;
};

class Register extends React.Component<RegisterProps, RegisterState> {
    constructor(props: RegisterProps) {
        super(props);
        this.state = {
          name: '',
          email: '',
          password: '',
          phoneNumber: '',
          code: '',
          registrationError: undefined,
          isInputInvalid: {
            name: false,
            email: false,
            password: false,
            phoneNumber: false
          },
          isLoading: false,
          isSigningIn: false,
          isButtonDisabled: true,
          isCodeSubmitButtonDisabled: true,
          accessToken: ''
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this)
        //this.serviceClient = new ServiceClient();
    }

    handleFailure(err: Error) {
        this.setLoading(false);
        this.setState({registrationError: err.message});
        this.setState({
          isButtonDisabled: false,
          isSigningIn: false
        });
    }
    
    getUserData() {
        return {
            name: this.state.name,
            email: this.state.email,
            password: this.state.password,
            phone_number: this.state.phoneNumber
        };
    }

    async handleSubmit(event: any, openModal: any) {
        this.setState({registrationError: undefined});
        const userData = this.getUserData();
        this.setLoading(true);
        this.setState({isButtonDisabled: true});
        event.preventDefault();
        await this.triggerCodeVerification(userData, openModal);
    }

    async triggerCodeVerification(userData: any, openModal: any) {
        try {
            await this.props.cognitoClient.registerUser(userData);
            this.setLoading(false);
            openModal(true);
        } catch(err: any) {
            this.handleFailure(err);
        }
    }

    setLoading(isLoading: boolean) {
        this.setState({isLoading});
    }

    handleInputChange(event: any) {
        let isInputInvalid: any = {};
        if(event.target.name === 'email') {
            isInputInvalid[event.target.name] = !FieldValidator.validateEmail(event.target.value);
        } else if(event.target.name === 'password') {
            isInputInvalid[event.target.name] = !FieldValidator.validatePassword(event.target.value);
        } else if(event.target.name === 'phoneNumber') {
            isInputInvalid[event.target.name] = !FieldValidator.validatePhoneNumber(event.target.value);
        } else {
            isInputInvalid[event.target.name] = false;
        }
        let isButtonDisabled = false;
        Object.keys(isInputInvalid).forEach((key) => {
            isButtonDisabled = isInputInvalid[key] || isButtonDisabled;
        })
        const obj: any = {
            isButtonDisabled,
            isInputInvalid
        };
        obj[event.target.name] = event.target.value;
        this.setState(obj);
    
    }

    onCodeChange(event: any) {
        const isValid = FieldValidator.validateCode(event.target.value);
        this.setState({
            isCodeSubmitButtonDisabled: !isValid,
            code: event.target.value
        });
    }

    async handleCodeSubmit(closeModal: any) {
        const userData: any = this.getUserData();
        userData.code = this.state.code;
        await this.registerUser(userData, closeModal);
    }

    async registerUser(userData: any, closeModal: any) {
        try {
            const credentials = await this.props.cognitoClient.confirmRegistration(userData.code, userData.email);
            closeModal();
            this.setState({
                isSigningIn: false
            });
            this.props.navigate('/login');
        } catch(err: any) {
            closeModal();
            this.handleFailure(err);
        }
    }
    render() {
        const defaultErrorMessage = "This field cannot be empty";
        const emailErrorMessage = "Email is invalid";
        const phoneErrorMessage = "Phone number is invalid";
        const passwordErrorMessage = "Password must be atleast 8 characters and must contain atleast one each of special, uppercase, lowercase characters and numbers";
        return (
            <Layout pageTitle={"Register"} navBarItems={[]}>
                <div>
                    <FormTable>
                        <TextRow label = "Name" name="name" value={this.state.name} onChange={this.handleInputChange} isInputInvalid={this.state.isInputInvalid.name} errorMessage={defaultErrorMessage}/>
                        <TextRow label = "Email" name="email" value={this.state.email} onChange={this.handleInputChange} isInputInvalid={this.state.isInputInvalid.email} errorMessage={emailErrorMessage}/>
                        <TextRow label = "Password" name="password" value={this.state.password} onChange={this.handleInputChange} isInputInvalid={this.state.isInputInvalid.password} errorMessage={passwordErrorMessage}/>
                        <TextRow label = "Mobile Number with country code starting with +" name="phoneNumber" value={this.state.phoneNumber} onChange={this.handleInputChange} isInputInvalid={this.state.isInputInvalid.phoneNumber} errorMessage={phoneErrorMessage}/>
                    </FormTable>
                    <CodeConfirmationPopup handleSubmit={this.handleSubmit} isButtonDisabled={this.state.isButtonDisabled} code={this.state.code} onCodeChange={this.onCodeChange.bind(this)} handleCodeSubmit={this.handleCodeSubmit.bind(this)} isCodeSubmitButtonDisabled={this.state.isCodeSubmitButtonDisabled} isSigningIn={this.state.isSigningIn}/>

                    {
                        this.state.isLoading
                            ?<div>Signing Up...</div>
                            : null
                    }
                    {
                        this.state.registrationError != null
                            ? <div className={styles.errorToolTip}>{this.state.registrationError}</div>
                            : null
                    }
                    
                </div>
            </Layout>
        );
    }
}

export default withRouter(Register);