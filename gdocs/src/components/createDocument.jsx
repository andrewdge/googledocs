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
          console.log(name)
            let req = await fetch('/collection/create', {
                method: "POST",
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({name})
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
<<<<<<< HEAD
                    Document Name:
                    <input type="text" name="name" value={name} onChange={handleChange} />
=======
                    New Document Name:
                    <input type="text" value={name} onChange={handleChange} />
>>>>>>> 5ce46d08ed6bb9bbf32138e1b075ba449457eff7
                </label>
                <input type="submit" value="Add Document" />
            </form>
            
        </>
    );
}