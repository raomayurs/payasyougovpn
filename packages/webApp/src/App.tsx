import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UsageHistory from './pages/UsageHistory';
import { CognitoClient } from './utils/CognitoClient';
import { cognitoConfig } from './config/cognito';


const Main = () => {
  // const userPoolId = process.env.REACT_APP_USER_POOL_ID as string;
  // const clientId = process.env.REACT_APP_CLIENT_ID as string;
  // const identityPoolId = process.env.REACT_APP_IDENTITY_POOL_ID as string;
  // const region = process.env.REACT_APP_REGION as string;

  const { userPoolId, identityPoolId, clientId, region } = cognitoConfig;

  const cognitoClient = new CognitoClient(userPoolId, identityPoolId, clientId, region);
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home region={region} cognitoClient={cognitoClient}/>}></Route>
        <Route path='/login' element={<Login cognitoClient={cognitoClient}/>}></Route>
        <Route path='/register' element={<Register cognitoClient={cognitoClient}/>}></Route>
        <Route path='/home' element={<Home region={region} cognitoClient={cognitoClient}/>}></Route>
        <Route path='/usageHistory' element={<UsageHistory region={region} cognitoClient={cognitoClient}/>}></Route>
      </Routes>
    </Router>
  );
}

export default Main;