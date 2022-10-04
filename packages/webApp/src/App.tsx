import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UsageHistory from './pages/UsageHistory';
import { CognitoClient } from './utils/CognitoClient';
import * as cognitoConfig from '../config/cognito.json';


const Main = () => {
  const userPoolId = cognitoConfig.userPoolId;
  const clientId = cognitoConfig.clientId;
  const identityPoolId = cognitoConfig.identityPoolId;
  const region = cognitoConfig.region;
  const cognitoClient = new CognitoClient(userPoolId, identityPoolId, clientId, region);
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home cognitoClient={cognitoClient}/>}></Route>
        <Route path='/login' element={<Login cognitoClient={cognitoClient}/>}></Route>
        <Route path='/register' element={<Register cognitoClient={cognitoClient}/>}></Route>
        <Route path='/home' element={<Home region={region} cognitoClient={cognitoClient}/>}></Route>
        <Route path='/usageHistory' element={<UsageHistory region={region} cognitoClient={cognitoClient}/>}></Route>
      </Routes>
    </Router>
  );
}

export default Main;