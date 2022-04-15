import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from 'react'

export default function Signup() {
    let navigate = useNavigate();

    const [inputs, setInputs] = useState({});

    const handleChange = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        setInputs(values => ({ ...values, [name]: value}))
    }   

    const handleSignUp = async (e) => {
        console.log('clicked')
        let json = JSON.stringify({ name: inputs.name, email: inputs.email, password: inputs.password})
        console.log(json)
        

        if (inputs.email === '' || inputs.password === '' || inputs.name === '') {
            console.log('empty')
            return;
        }

        let req = await fetch('/users/login', {
            method: "POST",
            header: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'credentials': 'include'
            },
            body: json
        });
        if (req) {
            console.log('received');
        }

        // navigate('/home')
    }

    return (
        <>
            <div>
                Signup
            </div>
            <form onSubmit={handleSignUp}>
                <label>
                    Name: 
                    <input type="text" name="name" value={inputs.name || ""} onChange={handleChange} /> 
                </label>
                <label>
                    Email: 
                    <input type="text" name="email" value={inputs.email || ""} onChange={handleChange} /> 
                </label>
                <label>
                    Password: 
                    <input type="text" name="password" value={inputs.password || ""} onChange={handleChange} /> 
                </label>
                <input type="submit" value="Submit" />
                
            </form>
        </>
    );
}