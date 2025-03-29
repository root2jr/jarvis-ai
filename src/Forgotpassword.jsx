import React from 'react'
import bg from './bg.mp4'
import './Fp.css'

const Forgotpassword = () => {
    return (
        <div className='forgotpage'>
            <video autoPlay muted loop id='bgVideo'>
                <source src={bg} type='video/mp4' />
            </video>
            <div className="bg-layer">
                <h1 id='otp-head'>An OTP has been sent to your E-MAIL</h1>
                <input id='email' placeholder='Enter your E-MAIL' type='email'></input>
                <input id='OTP' placeholder='Enter the OTP'></input>
                <button>Enter</button>
            </div>
        </div>
    )
}

export default Forgotpassword