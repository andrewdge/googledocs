import { useParams, useNavigate, Link } from "react-router-dom";
import { useCookies } from 'react-cookie';
import { useEffect, useState } from 'react'

export default function DocList({key, id, name}) {
    // const [cookies, setCookie, removeCookie] = useCookies();

    const handleDelete = async (e) => {
        console.log('clicked delete')
        // console.log(id)
        let req = await fetch('/collection/delete', {
            method: "POST",
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify({docid: id})
        });
        if (req) {
            console.log("doc: " + name + " with id: "+ id + " was submitted")
        }
    }


    return (
        <div style={{ display: "flex", flexDirection: "row", marginBottom: 10 }}>
            <div key={key} style={{ fontWeight: "semibold", fontSize: 20, marginRight: 100 }}>
                {name}
            </div>
            <button onClick={handleDelete}>
                Delete
            </button>
        </div>
    );
}