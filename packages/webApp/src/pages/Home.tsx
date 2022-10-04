import React from "react";
import Layout from "../components/Layout";
import { withRouter } from "../components/WithRouter";
import { DropdownRow, FormTable } from "../components/FormInput";
import styles from "../styles/form-input.module.css";
import { ConnectionDetails, getServerDetails, startVPNConnection, stopVPNConnection } from "../utils/VpnConnection"
import { getLambdaClient } from "../utils/LambdaUtil";
import { CognitoClient } from "../utils/CognitoClient";

export type HomeProps = {
    cognitoClient: CognitoClient;
    navigate: any;
    region: string;
};

export type Credentials = {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
};

export type HomeState = {
    region: string,
    isSubmitButtonDisabled: boolean,
    startConnectionError?: string,
    currentTab: string,
    isStopButtonDisabled: boolean,
    connectionDetails?: ConnectionDetails;
    loginRequired: boolean;
    isConnectionDetailsLoading: boolean;
};

const REGIONS = ["India", "United Kingdom", "United States", "Japan"];

const getRegion = (awsRegion: string) => {
    const REGIONS_TO_AWS_REGIONS_MAP: {[key: string]: string} = {
        "ap-south-1": "India",
        "eu-west-2": "United Kingdom",
        "us-east-1": "United States",
        "ap-northeast-1": "Japan"
    };
    return REGIONS_TO_AWS_REGIONS_MAP[awsRegion];
}

const StartConnectionTab = (props: {
    switchTab: any,
    navigate: any,
    setConnectionDetails: any,
    region: string
}) => {
    const [region, setRegion] = React.useState(REGIONS[0]);
    const [ isSubmitButtonDisabled, setIsSubmitButtonDisabled ] = React.useState(false);
    const [ connectionError, setConnectionError ] = React.useState(undefined);

    const handleChange = (event: any) => setRegion(event.target.value);

    const handleStartConnection = async () => { 
        try {
            const userId = sessionStorage.getItem("userId") as string;
            const lambdaClient = getLambdaClient(props.region);
            if (!lambdaClient) {
                props.navigate("/login");
            } else {
                setIsSubmitButtonDisabled(true);
                const connectionDetails = await startVPNConnection(lambdaClient, region, userId);
                props.setConnectionDetails(connectionDetails);
                setIsSubmitButtonDisabled(false);
                props.switchTab();
            }
        } catch(err: any) {
            setIsSubmitButtonDisabled(false);
            setConnectionError(err.message);
        }
    }

    return (
        <div>
            <FormTable>
                <DropdownRow label={"Choose Region"} value={region} items={REGIONS} onChange={handleChange}/>
            </FormTable>
            <button
                name="Submit"
                onClick={handleStartConnection}
                disabled={isSubmitButtonDisabled}
            >
                Start Connection
            </button>
            {
                isSubmitButtonDisabled
                    ? <div>Starting VPN Connection...</div>
                    : null
            }

            {
                connectionError != null
                    ? <div className={styles.errorToolTip}>{connectionError}</div>
                    : null
            }
        </div>
    );
};

const StopConnectionTab = (props: { region: string, switchTab: any, navigate: any, connectionDetails: ConnectionDetails, invalidateConnectionDetails: any }) => {
    const [ isSubmitButtonDisabled, setIsSubmitButtonDisabled ] = React.useState(false);
    const [ connectionError, setConnectionError ] = React.useState(undefined);

    const handleStopConnection = async () => {
        try {
            const userId = sessionStorage.getItem("userId") as string;
            const lambdaClient = getLambdaClient(props.region);
            if (!lambdaClient) {
                props.navigate("/login");
            } else {
                setIsSubmitButtonDisabled(true);
                await stopVPNConnection(lambdaClient, userId, props.connectionDetails.connectionId, props.connectionDetails.vpnServerDetails.region);
                props.invalidateConnectionDetails();
                setIsSubmitButtonDisabled(false);
                props.switchTab();
            }
            
        } catch(err: any) {
            setIsSubmitButtonDisabled(false);
            setConnectionError(err.message);
        }
    };
    return (
        <div>
            <FormTable>
                <div>
                    <label className="col-sm-3 col-form-label">Connection Id: </label>
                    <label className="col-sm-3 col-form-label">{props.connectionDetails.connectionId}</label>
                </div>
                <div>
                    <label className="col-sm-3 col-form-label">Hostname: </label>
                    <label className="col-sm-3 col-form-label">{props.connectionDetails.vpnServerDetails.hostname}</label>
                </div>
                <div>
                    <label className="col-sm-3 col-form-label">Username: </label>
                    <label className="col-sm-3 col-form-label">{props.connectionDetails.vpnServerDetails.username}</label>
                </div>
                <div>
                    <label className="col-sm-3 col-form-label">Password: </label>
                    <label className="col-sm-3 col-form-label">{props.connectionDetails.vpnServerDetails.password}</label>
                </div>
                <div>
                    <label className="col-sm-3 col-form-label">Region: </label>
                    <label className="col-sm-3 col-form-label">{getRegion(props.connectionDetails.vpnServerDetails.region)}</label>
                </div>
            </FormTable>
            <button
                name="StopConnection"
                onClick={handleStopConnection}
                disabled={isSubmitButtonDisabled}
            >
                Stop Connection
            </button>
            {
                isSubmitButtonDisabled
                    ? <div>Stopping VPN Connection...</div>
                    : null
            }

            {
                connectionError != null
                    ? <div className={styles.errorToolTip}>{connectionError}</div>
                    : null
            }
        </div>
    );
};

const HomePageTabs = (props: {region: string, connectionDetails?: ConnectionDetails, navigate: any, setConnectionDetails: any, setTab: any}) => {
    if (props.connectionDetails?.connectionId != null) {
        return (
            <StopConnectionTab region={props.region} switchTab={() => props.setTab("viewConnection")} navigate={props.navigate} connectionDetails={props.connectionDetails} invalidateConnectionDetails={() => props.setConnectionDetails()}/>
        )
    } else {
        return (<StartConnectionTab 
            region={props.region}
            switchTab={() => props.setTab("viewConnection")}
            navigate={props.navigate}
            setConnectionDetails={(connectionDetails: ConnectionDetails) => {console.log()}}
        />)
    }
};

const HomePageLayout = (props: {region: string, isConnectionDetailsLoading: boolean, connectionDetails?: ConnectionDetails, navigate: any, setConnectionDetails: any, setTab: any}) => {
    return (
        props.isConnectionDetailsLoading === true
        ? <div>Checking for open connections...</div>
        : <HomePageTabs
            connectionDetails={props.connectionDetails}
            navigate={props.navigate}
            setConnectionDetails={props.setConnectionDetails}
            setTab={props.setTab}
            region={props.region}
            />
    )
};

class Home extends React.Component<HomeProps, HomeState> {
    constructor(props: HomeProps) {
        super(props);
        this.state = {
            region: REGIONS[0],
            isSubmitButtonDisabled: false,
            currentTab: "startConnection",
            isStopButtonDisabled: false,
            loginRequired: true,
            isConnectionDetailsLoading: true
        };
    }

    handleChange(event: any) {
        this.setState({region: event.target.value});
    }

    setTab(tab: string) {
        this.setState({currentTab: tab});
    }

    handleSignOut() {
        try {
            this.props.cognitoClient.signOut();
            this.props.navigate("/login");
        } catch(err) {
            console.log(err)
        }
        
        
    }

    async componentDidMount() {
        const userId = sessionStorage.getItem("userId") as string;
        if (userId == null) {
            this.setState({loginRequired: true })
        } else {
            const lambdaClient = getLambdaClient(this.props.region);
            
            if (lambdaClient) {
                const connectionDetails = await getServerDetails(lambdaClient, userId);
                if (connectionDetails != null) {
                    this.setState({connectionDetails, loginRequired: false, isConnectionDetailsLoading: false })
                } else {
                    this.setState({connectionDetails, loginRequired: false, isConnectionDetailsLoading: false })
                }
                
            } else {
                this.props.navigate('/login');
            }
        }
    }

    setConnectionDetails(connectionDetails?: ConnectionDetails) {
        this.setState({connectionDetails});
    }

    render() {
        if (this.state.loginRequired) {
            this.props.navigate('/login');
        }
        return (
            <Layout 
                pageTitle={this.state.connectionDetails?.connectionId != null ? "Your VPN Connection" : "Start new VPN Connection"}
                navBarItems={
                    [
                        {name: "Usage History", onClick: () => this.props.navigate('/usageHistory')},
                        {name: "Sign Out", onClick: this.handleSignOut.bind(this)},
                    ]
                }
            >
                <HomePageLayout
                    region={this.props.region}
                    connectionDetails={this.state.connectionDetails}
                    navigate={this.props.navigate}
                    setConnectionDetails={this.setConnectionDetails.bind(this)}
                    setTab={this.setTab.bind(this)}
                    isConnectionDetailsLoading={this.state.isConnectionDetailsLoading}
                />
            </Layout>
        );
    }
}

export default withRouter(Home);