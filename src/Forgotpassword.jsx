import { useState } from 'react';
import bg from './bg.mp4';
import './Fp.css';
import axios from 'axios';
import { useRef } from 'react';


const Forgotpassword = () => {
    const otpRef = useRef(null);
    const [firstotp, setFirstotp] = useState();
    const [mailName, setMailName] = useState();
    const [newpass, setNewpass] = useState();
    const jwt = localStorage.getItem('token');

    const sendEmail = async () => {
        if (newpass == 1) {
            const newpassword = document.getElementById('email').value;
            const passchange = axios.post('https://jarvis-ai-1.onrender.com/login', {
                usermail: mailName,
                password: newpassword,
                change: 'yes'
            }, {
                headers: {
                    Authorization: `Bearer ${jwt}`
                }
            })
            return;
        }
        const usermail = document.getElementById('email').value;
        setMailName(usermail);
        const userotp = document.getElementById('OTP').value;
        const mailinput = document.getElementById('email');
        const otpinput = document.getElementById('OTP');
        if (userotp) {
            if (userotp == firstotp) {
                alert('SUCCESS!');
                mailinput.value = '';
                mailinput.placeholder = 'Enter New Password';
                otpinput.value = '';
                otpRef.current.classList.toggle('init');
                setNewpass(1);
                return;
            }
        }


        const otp = Math.floor(100000 + Math.random() * 900000);
        setFirstotp(otp);
        if (!usermail) {
            alert('Please enter your email.');
            return;
        }

        else {
            console.log('Sending email...');

            try {
                const response = await axios.post('https://jarvis-ai-1.onrender.com/otp', {
                    usermail: usermail,
                    otp: otp,
                });
                console.log('Response:', response);
                otpRef.current.classList.toggle('init');
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to send email. Try again.');
            }

        }
    };

    return (
        <div className='forgotpage'>
            <video autoPlay muted loop id='bgVideo'>
                <source src={bg} type='video/mp4' />
            </video>
            <div className="bg-layer">
                <h1 id='otp-head'>YOUR EMAIL</h1>
                <input id='email' placeholder='Enter your E-MAIL' type='email' />
                <input ref={otpRef} id='OTP' placeholder='OTP' type='number' />
                <button onClick={sendEmail}>Enter</button>
            </div>
        </div>
    );
};

export default Forgotpassword;
