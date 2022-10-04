import React from "react";
import Layout from "../components/Layout";
import { getLambdaClient } from "../utils/LambdaUtil";
import Table from 'react-bootstrap/Table';
import { CognitoClient } from "../utils/CognitoClient";
import { getVpnSessions, VPNSession, VPNSessions } from "../utils/VpnConnection";
import { withRouter } from "../components/WithRouter";

export type UsageHistoryProps = {
    navigate: any;
    cognitoClient: CognitoClient;
    region: string
};
export type UsageHistoryState = {
    vpnSessions: VPNSessions,
    loginRequired: boolean,
    totalsPerRegion: {[key: string]: number},
    total: number,
    isVpnSessionsLoading: boolean
};

const getRegion = (awsRegion: string) => {
    const REGIONS_TO_AWS_REGIONS_MAP: {[key: string]: string} = {
        "ap-south-1": "India",
        "eu-west-2": "United Kingdom",
        "us-east-1": "United States",
        "ap-northeast-1": "Japan"
    };
    return REGIONS_TO_AWS_REGIONS_MAP[awsRegion];
}

const UsageHistoryData = (props: { regions: string[], vpnSessions: VPNSessions, totalsPerRegion: {[key: string]: number} }) => {
    const regions = Object.keys(props.vpnSessions); 
    return regions.length > 0
        ?<div>{regions.map((region) => {
            const rows = props.vpnSessions[region];
            return (
                <div>
                    <div>
                        <label className="col-sm-3 col-form-label">Region: </label>
                        <label className="col-sm-3 col-form-label">{region}</label>
                    </div>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Instance Type</th>
                                <th>Start time</th>
                                <th>Stop time</th>
                                <th>Cost per hour</th>
                                <th>Usage in hours</th>
                                <th>Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                rows.map((vpnSession, index) => {
                                    return (
                                        <tr>
                                            <td>{vpnSession.instanceType}</td>
                                            <td>{vpnSession.launchTime}</td>
                                            <td>{vpnSession.stopTime}</td>
                                            <td>{vpnSession.costPerHour}</td>
                                            <td>{vpnSession.totalTimeUsed/3600000}</td>
                                            <td>{vpnSession.costOfSession}</td>
                                        </tr>
                                    )
                                })
                            }
                            
                        </tbody>
                    </Table>
                    <div>
                        <label className="col-sm-3 col-form-label">Total for region: </label>
                        <label className="col-sm-3 col-form-label">{props.totalsPerRegion[region]}</label>
                    </div>
                </div>
            )
        })}</div>
        : <div>No VPN Connections</div>
    
    
}

const UsageHistoryLayout = (props: { regions: string[], isVpnSessionsLoading: boolean, vpnSessions: VPNSessions, totalsPerRegion: {[key: string]: number} }) => {
    if (props.isVpnSessionsLoading) {
        return <div>Querying for past Usage History...</div>
    } else {
        return <UsageHistoryData
            regions={props.regions}
            vpnSessions={props.vpnSessions}
            totalsPerRegion={props.totalsPerRegion}
        />
    }
}



class UsageHistory extends React.Component<UsageHistoryProps, UsageHistoryState> {
    constructor(props: UsageHistoryProps) {
        super(props);
        this.state = {
            vpnSessions: {},
            loginRequired: true,
            totalsPerRegion: {},
            total: 0,
            isVpnSessionsLoading: true
        }
    }
    getTotals(vpnSessions: VPNSessions) {
        const totalsPerRegion: {[key: string]: number} = {};
        let total = 0;
        Object.keys(vpnSessions).forEach((region) => {
            const vpnSessionList = vpnSessions[region];
            let totalForRegion = 0;
            vpnSessionList.forEach((vpnSession: VPNSession) => {
                totalForRegion += vpnSession.costOfSession;
            });
            total += totalForRegion;
            totalsPerRegion[region] = totalForRegion;
        });
        return { totalsPerRegion, total };
    }
    async componentDidMount() {
        const userId = sessionStorage.getItem("userId") as string;
        if (userId == null) {
            this.setState({loginRequired: true })
        } else {
            const lambdaClient = getLambdaClient(this.props.region);
            
            if (lambdaClient) {
                const vpnSessions = await getVpnSessions(lambdaClient, userId) as VPNSessions;
                if (vpnSessions != null) {
                    const { totalsPerRegion, total } = this.getTotals(vpnSessions);
                    console.log({ totalsPerRegion, total });
                    this.setState({vpnSessions, loginRequired: false, totalsPerRegion, total, isVpnSessionsLoading: false })
                } else {
                    this.setState({vpnSessions, loginRequired: false, isVpnSessionsLoading: false })
                }
                
            } else {
                this.props.navigate('/login');
            }
        }
    }

    handleSignOut() {
        try {
            this.props.cognitoClient.signOut();
            this.props.navigate("/login");
        } catch(err) {
            console.log(err)
        }   
    }
    render() {
        if (this.state.loginRequired) {
            this.props.navigate('/login');
        } 
        const regions = Object.keys(this.state.vpnSessions);
        return (
            <Layout 
                pageTitle={"Usage History"} 
                navBarItems={
                    [
                        {name: "Sign Out", onClick: this.handleSignOut.bind(this)},
                    ]
                }
            >
                {/* {
                    regions.length > 0
                    ?regions.map((region) => {
                        const rows = this.state.vpnSessions[region];
                        return (
                            <div>
                                <div>
                                    <label className="col-sm-3 col-form-label">Region: </label>
                                    <label className="col-sm-3 col-form-label">{region}</label>
                                </div>
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Instance Type</th>
                                            <th>Start time</th>
                                            <th>Stop time</th>
                                            <th>Cost per hour</th>
                                            <th>Usage in hours</th>
                                            <th>Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            rows.map((vpnSession, index) => {
                                                return (
                                                    <tr>
                                                        <td>{vpnSession.instanceType}</td>
                                                        <td>{vpnSession.launchTime}</td>
                                                        <td>{vpnSession.stopTime}</td>
                                                        <td>{vpnSession.costPerHour}</td>
                                                        <td>{vpnSession.totalTimeUsed/3600000}</td>
                                                        <td>{vpnSession.costOfSession}</td>
                                                    </tr>
                                                )
                                            })
                                        }
                                        
                                    </tbody>
                                </Table>
                                <div>
                                    <label className="col-sm-3 col-form-label">Total for region: </label>
                                    <label className="col-sm-3 col-form-label">{this.state.totalsPerRegion[region]}</label>
                                </div>
                            </div>
                        )
                    })
                    : <div>No VPN Connections</div>
                } */}
                <UsageHistoryLayout
                    regions={regions}
                    isVpnSessionsLoading={this.state.isVpnSessionsLoading}
                    totalsPerRegion={this.state.totalsPerRegion}
                    vpnSessions={this.state.vpnSessions}
                />
                {
                    regions.length > 0
                    ? <div>
                            <label className="col-sm-3 col-form-label">Grand Total for all regions: </label>
                            <label className="col-sm-3 col-form-label">{this.state.total}</label>
                        </div>
                    : <div></div>
                }
            </Layout>
        );
    }
}

export default withRouter(UsageHistory);