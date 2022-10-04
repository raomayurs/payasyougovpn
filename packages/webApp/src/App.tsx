import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UsageHistory from './pages/UsageHistory';
import { CognitoClient } from './utils/CognitoClient';


const Main = () => {
  const userPoolId = "eu-west-2_1YfzVBHg0";
  const clientId = "2o1gk3948sfv18q8j2b9f7ddd9";
  const identityPoolId = "eu-west-2:3ba62f93-9659-4b75-9965-e2f1d2bc6fbe";
  const region = "eu-west-2";
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