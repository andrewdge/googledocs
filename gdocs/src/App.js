import React, { useState } from 'react';
import { Navigate, Outlet, Link } from "react-router-dom";
import Login from "./components/login"
import Logout from "./components/logout"
import Signup from './components/signup'
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
        {!cookies.name ? 
          <>
            <Signup />
            <Login />
          </>
        : 
        <Navigate to={{
            pathname: "/home"
          }}/>
        }
      </div>
      
    </div>
  );
}
