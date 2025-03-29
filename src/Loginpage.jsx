import React, { useEffect } from 'react'
import './login.css'
import bgVideo from './bg.mp4'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const Loginpage = () => {
    const navigate = useNavigate();

    function successPage() {

        setTimeout(() => {
            navigate('/ai');
        }, 2000)
    }




    const sendData = async (e) => {
        e.preventDefault();
        const msg = document.getElementById('msg');
        const fail = document.getElementById('fail');
        let username = document.getElementById('username').value;
        let password = document.getElementById('password').value;
        let span = document.getElementById('span');
        let u = document.getElementById('username');
        let p = document.getElementById('password');
        console.log('working');
        if(username == "" || password == ""){
            fail.innerText = "Enter valid Credentials";
            msg.classList.toggle('success');
           return ;
        }

        const response = await axios.post('https://jarvis-ai-1.onrender.com/login', {
            usermail: usermail,
            password: password
        });
        console.log(response.data);
        const data = response.data;
        u.value = '';
        p.value = '';

        if (data.status === 'ok') {
            fail.innerText = "NEW USER CREATED!"
            msg.classList.toggle('success');
            localStorage.setItem('token', response.data.token);

            successPage();

        }
        else if (data.status === 'login') {
            msg.classList.toggle('success');
            localStorage.setItem('token', response.data.token);

            successPage();

        }
        else if (data.status == 'error') {
            fail.innerText = "LOGIN FAILED!"
            span.innerText = <i class="fa-solid fa-xmark"></i>;
            msg.classList.toggle("success");

        }
        else {
            fail.innerText = "LOGIN FAILED!"
            msg.classList.toggle("success");

        }
    }









    return (
        <div className='login'>
            <video autoPlay muted loop id='bgVideo'>
                <source src={bgVideo} type='video/mp4' />
            </video>
            <div className="bg-layer">
                <div id='msg' className="login-msg">
                    <h1 id='fail'>LOGIN SUCCESFUL! <span id='span'> <i class="fa-solid fa-check"></i></span></h1>
                </div>
                <div className="login-box">
                    <h1>Login</h1>

                    {/* Add name attr & use 'new-username' to prevent Chrome from autofilling */}
                    <input
                        type="mail"
                        name=",ail"
                        placeholder="Enter Your Mail ID"
                        autoComplete="new-username"
                        id='username'
                    />

                    {/* Same here for password */}
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        autoComplete="new-password"
                        id='password'
                    />

                    <button className="btn" onClick={sendData}>Login</button>
                </div>
            </div>
            
        </div>
      
    )
}




export default Loginpage;
