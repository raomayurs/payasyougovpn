import React from "react";
import { FormTable, TextRow } from "../components/FormInput";
import Layout from "../components/Layout";
import { withRouter } from "../components/WithRouter";
import styles from "../styles/form-input.module.css";
import { CognitoClient } from "../utils/CognitoClient";
import FieldValidator from "../utils/FieldValidator";

export type LoginState = {
    username: string,
    password: string,
    accessToken: string,
    isInputInvalid: {
        username: boolean,
        password: boolean
    },
    isSubmitButtonDisabled: boolean,
    isLoading: boolean,
    loginError?: string,
    isButtonDisabled: boolean
}

export type LoginProps = {
    cognitoClient: CognitoClient;
    navigate: any;
};

class Login extends React.Component<LoginProps, LoginState> {
    constructor(props: LoginProps) {
        super(props);
        this.state = {
            username: '',
            password: '',
            accessToken: '',
            isInputInvalid: {
                username: false,
                password: false
            },
            isSubmitButtonDisabled: true,
            isLoading: false,
            isButtonDisabled: false
        };
    }

    handleInputChange(event: any) {
        let isInputInvalid: any = {};
        if((event.target.value == null || event.target.value === '')) {
            isInputInvalid[event.target.name] = true;
        } else if(event.target.name === 'username') {
            isInputInvalid[event.target.name] = !FieldValidator.validateEmail(event.target.value);
        } else if(event.target.name === 'password') {
            isInputInvalid[event.target.name] = !FieldValidator.validatePassword(event.target.value);
        }
        let isSubmitButtonDisabled = false;
        Object.keys(isInputInvalid).forEach((key) => {
            isSubmitButtonDisabled = isInputInvalid[key] || isSubmitButtonDisabled;
        })
        const obj: any = {
            isSubmitButtonDisabled,
            isInputInvalid
        };
        obj[event.target.name] = event.target.value;
        this.setState(obj);
        this.setState({
            loginError: undefined
        });  
    }

    async handleSubmit() {
        this.setLoading(true);
        const data = {
            username: this.state.username,
            password: this.state.password
        };
        // Handle cognito login
        try {
            await this.props.cognitoClient.authenticateUser(data.username, data.password);
            this.setLoading(false);
            this.props.navigate('/home');
        } catch(err: any) {
            this.handleFailure(err);
        }
    }

    handleFailure(err: Error) {
        console.log(err)
        this.setLoading(false);
        this.setState({loginError: err.message});
        this.setState({
          isButtonDisabled: false
        });
    }

    setLoading(isLoading: boolean) {
        this.setState({
            isLoading
        });
    }

    handleSignUp() {
        //let navigate = useNavigate();
        this.props.navigate('/register');
    }

    render() {
        const passwordErrorMessage = "Password must be atleast 8 characters and must contain atleast one each of special, uppercase, lowercase characters and numbers";
        const usernameErrorMessage = "Email is invalid";
        return (
            <Layout pageTitle={"Sign In"} navBarItems={[]}>
                <FormTable>
                    <TextRow label = "Username:" name="username" value={this.state.username} onChange={this.handleInputChange.bind(this)} isInputInvalid={this.state.isInputInvalid.username} errorMessage={usernameErrorMessage}/>
                    <TextRow label = "Password:" name="password" value={this.state.password} onChange={this.handleInputChange.bind(this)} isInputInvalid={this.state.isInputInvalid.password} errorMessage={passwordErrorMessage}/>
                </FormTable>
                <button
                    name="Submit"
                    onClick={this.handleSubmit.bind(this)}
                    disabled={this.state.isSubmitButtonDisabled}>
                        Submit
                </button>

                <button
                    name="SignUp"
                    onClick={this.handleSignUp.bind(this)}
                    disabled={this.state.isButtonDisabled}>
                        Sign Up
                </button>

                {
                    this.state.isLoading
                        ? <div>Signing in...</div>
                        : null
                }

                {
                    this.state.loginError != null
                        ? <div className={styles.errorToolTip}>{this.state.loginError}</div>
                        : null
                }
            </Layout>
        );
    }
}

export default withRouter(Login);