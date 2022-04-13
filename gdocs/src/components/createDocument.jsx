import { useParams, useNavigate, Link } from "react-router-dom";
import { useCookies } from 'react-cookie';
import { useState } from 'react'

export default function CreateDocument() {
    // const [cookies, setCookie, removeCookie] = useCookies();
    let navigate = useNavigate();

    const [name, setName] = useState('')

    const handleSubmit = async (e) => {
        console.log('clicked')
        if (name !== '') {
            let req = await fetch('/collection/create', {
                method: "POST",
                header: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: name })
            })
            if (req) {
                console.log(name + " was submitted")
            }
        }
        // e.preventDefault()
    }

    const handleChange = (e) => {
        setName(e.target.value)
    }

    return (
        <>
            <form onSubmit={handleSubmit}>
                <label>
                    New Document Name:
                    <input type="text" value={name} onChange={handleChange} />
                </label>
                <input type="submit" value="Add Document" />
            </form>
            
        </>
    );
}