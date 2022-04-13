import React, { useState } from 'react';
import { Navigate, Outlet, Link } from "react-router-dom";
import Login from "./components/login"
import Logout from "./components/logout"
import { useCookies } from 'react-cookie';

export default function App() {
  const [cookies, setCookie] = useCookies(['name', 'id']);
  console.log(cookies);


  // function onChange(newName) {
  //   setCookie('name', newName, { path: '/' });
  // } 
  return (
    <div>
      <div>
        {cookies.name ? 
          <Navigate to={{
            pathname: "/home"
          }}/>
        : 
        <Login />}
      </div>
      
    </div>
  );
}
