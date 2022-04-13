import { useParams } from "react-router-dom";

export default function Login() {
    return (
        <>
            <div id="text">
                Signup
            </div>
            <form action="/users/signup" method="post">
                <section>
                    <label for="username">Username</label>
                    <input id="username" name="username" type="text" required />
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
                    <label for="username">Username</label>
                    <input id="username" name="username" type="text" required />
                </section>
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
    );
}