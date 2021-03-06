import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from 'react'

export default function Login() {
    let navigate = useNavigate();

    const [inputs, setInputs] = useState({});

    const handleChange = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        setInputs(values => ({ ...values, [name]: value}))
    }   

    const handleLogin = async (e) => {
        console.log('clicked')

        // e.preventDefault()
        let json = JSON.stringify(inputs)
        console.log(json)

        if (inputs.email === '' || inputs.password === '') {
            console.log('empty')
            return;
        }

        let req = await fetch('/users/login', {
            method: "POST",
            credentials: 'include',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(inputs)
        });
        if (req) {
            console.log('received');
        }
        e.preventDefault()

        // navigate('/home')
    }

    return (
        <>
            <div>
                Login
            </div>
            <form onSubmit={handleLogin}>
                <label>
                    Email: 
                    <input type="text" name="email" value={inputs.email || ""} onChange={handleChange} /> 
                </label>
                <label>
                    Password: 
                    <input type="text" name="password" value={inputs.password || ""} onChange={handleChange} /> 
                </label>
                <input type="submit" value="Submit" />
                {/* <button onClick={handleLogin}>Submit</button> */}
                
            </form>
        </>
    );
}