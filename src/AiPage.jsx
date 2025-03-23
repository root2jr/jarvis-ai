import React, { useEffect, useRef, useState } from 'react';
import './AiPage.css';
import aiBg from './4872-181170832.mp4';
import axios from 'axios';
import jarvisLogo from './jarvis-logo.jpg';

const AiPage = () => {
   
  const [name, setName] = useState('');

   const userfunc = async () =>{
    const usernamee = await  axios.get('http://localhost:5000/username');
    const username = usernamee.data;
    setName(username);
    console.log(name);
   }
   userfunc();











  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const [userid, setUserid] = useState('');
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('messages');
    return savedMessages
      ? JSON.parse(savedMessages)
      : [
          { type: 'user', text: "Wake Up J.A.R.V.I.S, Daddy's Home" },
          { type: 'bot', text: "Welcome Home Sir, What are we going to work on today?" },
        ];
  });
  const [loaderRef, setLoaderRef] = useState(false);

  const chatRef = useRef(null);
  const navRef = useRef(null);

  const saveData = async (message, conversationId) => {
    const timestamp = new Date().toISOString();
    const requests = [];

    if (message.text.toLowerCase().includes('my') && message.text.toLowerCase().includes('name')) {
      setName(message.text);
      requests.push(
        axios.post('https://jr-ai.onrender.com/conversations', {
          sender: message.type,
          message: message.text,
          timestamp,
          conversationId,
          username: name,
        })
      );
      console.log('Username is Saved!');
    

    }

    requests.push(
      axios.post('https://jr-ai.onrender.com/conversations', {
        sender: message.type,
        message: message.text,
        timestamp,
        conversationId,
      })
    );

    try {
      await Promise.all(requests);
    } catch (err) {
      console.error('Error saving data:', err);
    }
  };

  const getResponse = async () => {
    const inputField = document.getElementById('input');
    const message = inputField.value.trim();
    if (!message) return;

    const userMessage = { type: 'user', text: message };
    setMessages((prev) => [...prev, userMessage]);
    saveData(userMessage, userid);

    try {
      setLoaderRef(true);
      const res = await axios.post('https://jr-ai.onrender.com/api/gemini', {
        prompt: message,
        conversationId: userid,
      });
      let botMessageText = res.data.response.startsWith('JARVIS:')
        ? res.data.response.replace('JARVIS:', '')
        : res.data.response;
      const botMessage = { type: 'bot', text: botMessageText };
      setMessages((prev) => [...prev, botMessage]);
      saveData(botMessage, userid);
    } catch (err) {
      console.error('Error fetching response:', err);
    } finally {
      setLoaderRef(false);
      inputField.value = '';
    }
  };

  const startListening = () => {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      document.getElementById('input').value = transcript;
      getResponse();
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };
  };

  const resetChat = () => {
    localStorage.clear();
    setMessages([
      { type: 'user', text: "Wake Up J.A.R.V.I.S, Daddy's Home" },
      { type: 'bot', text: "Welcome Home Sir, What are we going to work on today?" },
    ]);
  };

  useEffect (() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  },[messages]);

  const toggleNav = () => {
    navRef.current.classList.toggle('hammy');
  };

  useEffect(() => {
    const storedId = localStorage.getItem('userid');
    if (storedId) {
      setUserid(storedId);
      console.log(storedId);
    } else {
      const newId = Math.floor(Math.random() * 1000) + 1;
      setUserid(newId);
      localStorage.setItem('userid', newId);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  return (
    <div className='aipage'>
      <video autoPlay loop muted>
        <source src={aiBg} type='video/mp4' />
      </video>

      <div className='content-bg'>
        <nav>
          <div className='nav-button' onClick={toggleNav}>
            <i className='fa-solid fa-bars'></i>
          </div>
          <div className='buttons' onClick={resetChat}>
            Reset Chat
          </div>
          <img src={jarvisLogo} alt='Jarvis Logo' />
          <h1>J.A.R.V.I.S</h1>
        </nav>

        <div className='ham-burger' ref={navRef}>
          <ul>
            <li>
              <button onClick={() => { resetChat(); toggleNav(); }}>DELETE CHAT</button>
            </li>
            <li>
              <a onClick={toggleNav}>AI</a>
            </li>
            <li>
              <a href='https://portfolio-jram-18.netlify.app/#about'>CREATOR</a>
            </li>
          </ul>
        </div>

        <div className='chat' ref={chatRef}>
          <ul className='chat-list'>
            {messages.map((msg, index) => (
              <li key={index} className={msg.type}>
                {msg.text}
              </li>
            ))}
            {loaderRef && (
              <div className='loader'>
                <img src={jarvisLogo} alt='Loading...' />
              </div>
            )}
          </ul>
        </div>

        <div className='input-wrapper'>
          <button className='send' onClick={getResponse}>
            <i className='fa-solid fa-paper-plane'></i>
          </button>
          <button className='sends' onClick={startListening}>
            <i className='fa-solid fa-microphone'></i>
          </button>
          <input
            id='input'
            placeholder='Ask J.A.R.V.I.S'
            onKeyDown={(e) => e.key === 'Enter' && getResponse()}
          />
        </div>
      </div>
    </div>
  );
};

export default AiPage;
