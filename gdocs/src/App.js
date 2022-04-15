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
            <div id="text">
                Signup
            </div>
            <form action="/users/signup" method="post">
                <section>
                    <label for="name">Name</label>
                    <input id="name" name="name" type="text" required />
                </section>
                <section>
                    <label for="password">Password</label>
                    <input id="password" name="password" type="text" required />
                </section>
                <section>
                    <label for="email">Email</label>
                    <input id="email" name="email" type="text" required />
                </section>
                <input type="submit" value="Submit" />

            </form>
            <div id="text">
                login
            </div>
            <form action="/users/login" method="post">
                <section>
                    <label for="email">Email</label>
                    <input id="email" name="email" type="text" required />
                </section>
                <section>
                    <label for="password">Password</label>
                    <input id="password" name="password" type="text" required />
                </section>

                <input type="submit" value="Submit" />

            </form>
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
