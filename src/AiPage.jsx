import React, { useEffect, useRef, useState } from 'react';
import './AiPage.css';
import aiBg from './bg3.mp4';
import axios from 'axios';
import jarvisLogo from './jarvis-logo.jpg';
import Tasks from './Tasks';
import * as chrono from "chrono-node";
import postImg from './Capture.jpg'
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'

const AiPage = () => {
  const navigate = useNavigate();

  function Loggout() {
    localStorage.clear();
    navigate('/');
  }



  const [lazyLoader, setLazyLoader] = useState(false);
  const [ison, setIson] = useState(false);
  const jwt = localStorage.getItem('token');
  const decodedJwt = jwtDecode(jwt);
  const usersname = decodedJwt.username.usermail;

  useEffect(() => {
    if (!usersname) {
      localStorage.clear();
    }
  }, [])

  const [name, setName] = useState('');
  const [taskbarName, setTaskbarName] = useState();





  useEffect(() => {
    const userfunc = async () => {
      const usernamee = await axios.get('https://jarvis-ai-8pr6.onrender.com/username', {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      });
      const username = usernamee.data;
      setName(username);
    }
    userfunc();
  }, [])


  






  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const [userid, setUserid] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'user', message: "Wake Up J.A.R.V.I.S, Daddy's Home" },
    { sender: 'bot', message: "Welcome Home Sir, What are we going to work on today?" },
  ]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setMessages([]);
        setLazyLoader(true);
        const res = await axios.get(`https://jarvis-ai-8pr6.onrender.com/conversations/${usersname}`, {
          headers: {
            Authorization: `Bearer ${jwt}`
          }
        });
        if (res) {
          if (Array.isArray(res.data.messages)) {
            setLazyLoader(false);
            setMessages(res.data.messages);
          } else {
            console.error("messages is not an array:", res.data.messages);
            setLazyLoader(false);
            setMessages([]);
          }
        }
      } catch (err) {
        setLazyLoader(false);
        console.error('Failed to fetch saved messages:', err);
      }
    };
    fetchMessages();
    
    const fetch_tasks = async () => {
      try{
        const response = await axios.post("http://jarvis-ai-8pr6.onrender.com/fetchtasks",{
          user: usersname
        });
        console.log(response.data.tasks);
        setTaskbarName(response.data.tasks);

      }
      catch(err) {
        console.error("Error Fetching Tasks:",err);
      }
    }
    
    fetch_tasks();

  }, []);

  const [loaderRef, setLoaderRef] = useState(false);

  const chatRef = useRef(null);
  const navRef = useRef(null);

  const speak = (text) => {
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.voice = window.speechSynthesis.getVoices().find(voice => voice.name === 'Google UK English');
      utterance.onend = () => {
        console.log('Speech finished');
      };
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
      }
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Speech Synthesis API not supported in this browser.');
    }
  };

  const saveData = async (message, conversationId) => {
    const timestamp = new Date().toISOString();
    const requests = [];

    requests.push(
      axios.post('https://jarvis-ai-8pr6.onrender.com/conversations', {
        sender: message.sender,
        message: message.message,
        timestamp,
        username: usersname,
        time: message.time,
        conversationId,
      }, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      })
    );

    try {
      await Promise.all(requests);
    } catch (err) {
      console.error('Error saving data:', err);
    }
  };




  const viewKeywords = [
    "what are my tasks",
    "show my tasks",
    "list tasks",
    "pending tasks",
    "tasks left",
    "to-do list",
    "what do i have to do",
    "task status",
    "view tasks",
    "open task list",
    "what's pending",
    "remind me my tasks",
    "open taskbar"
  ];




  const [taskName, setTaskName] = useState("");


  function formatGeminiResponse(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="strong">$1</strong>');

    const lines = text.split('\n');
    let formatted = '';

    for (let line of lines) {
      const trimmed = line.trim();

      if (/^\* (?!\*)/.test(trimmed)) {
        const cleanLine = trimmed.replace(/^\* (?!\*)/, '');
        formatted += `<p class="fake-bullet">• ${cleanLine}</p>`;
      } else {
        formatted += `<p>${trimmed}</p>`;
      }
    }

    return formatted;
  }




  function parseReminder(text) {
    let intent = "reminder";
    let task = "";
    let datetime = null;

    const parsedDate = chrono.parseDate(text);
    if (parsedDate) {
      datetime = parsedDate.toISOString();
      const chronoResult = chrono.parse(text);
      if (chronoResult.length > 0) {
        text = text.replace(chronoResult[0].text, "").trim();
      }
    }

    task = text.replace(/remind me to|set me a reminder to|alert me about|remind me that/, "").trim();
    console.log(datetime);
    return { intent, task, datetime };
  }
  function parseTasks(text) {
    let intent = "task";
    let task = "";
    let datetime = null;

    const parsedDate = chrono.parseDate(text);
    if (parsedDate) {
      datetime = parsedDate.toISOString();
      const chronoResult = chrono.parse(text);
      if (chronoResult.length > 0) {
        text = text.replace(chronoResult[0].text, "").trim();
      }
    }

    task = text.replace(/"add task|note down|remember to |schedule me/, "").trim();

    return { intent, task, datetime };
  }





  const getResponse = async () => {
    const inputField = document.getElementById('input');
    const message = inputField.value.trim();
    const date = new Date;
    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    if (!message) return;
    const isViewTaskMessage = (message) => {
      return viewKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
      );
    };
    if (isViewTaskMessage(message)) {
      let TaskbarToggle = document.getElementById('taskbar');
      TaskbarToggle.classList.toggle("tasktoggle");
      inputField.value = "";
      return;
    }
    if (message == "clear tasks") {
      setTaskbarName([{ type: 'task', text: '' }]);
    }
    setLoaderRef(true);
    const userMessage = { sender: 'user', message: message, time: time };
    setMessages((prev) => [...prev, userMessage]);
    saveData(userMessage, userid);

    const check_intent = async (message) => {
      const response = await axios.post("https://jarvis-ai-8pr6.onrender.com/predict", {
        text: message
      })
      return response.data.intent;
    }
    const intent = await check_intent(message);
    if (intent == "task") {

      const parsedmessa = parseTasks(message);
      const aiBotReply = await axios.post('https://jarvis-ai-8pr6.onrender.com/api/gemini', {
        prompt: `you are sending the user a reminding message as JARVIS for this'${parsedmessa.task}',make it in a single line`
      }, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      });
      const remmess = aiBotReply.data.response.replace(/JARVIS:/g, '').replace(/<\/?p[^>]*>/gi, '');
      const saveTaskdeadline = await axios.post("https://jarvis-ai-8pr6.onrender.com/tasks", {
        username: usersname,
        intent: parsedmessa.intent,
        datetime: parsedmessa.datetime,
        task: remmess
      }, {
        headers: {
          Authorization: `Bearer ${jwt}`
        },
      })
      setTaskName(parsedmessa.task);
      setTaskbarName((prev) => [...prev, { type: 'task', message: parsedmessa.task }]);
      inputField.value = ""
    }


    else if (intent == "reminder") {
      console.log("Reminder Detected");
      const parsedmess = parseReminder(message);
      const aiBotReply = await axios.post('https://jarvis-ai-8pr6.onrender.com/api/gemini', {
        prompt: `you are sending the user a reminding message as JARVIS for this'${parsedmess.task}',make it in a single line`
      }, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }

      });
      const remmess = aiBotReply.data.response.replace(/<\/?p[^>]*>/gi, '');

      const sendReminder = await axios.post("https://jarvis-ai-8pr6.onrender.com/reminders", {
        username: usersname,
        intent: parsedmess.intent,
        datetime: parsedmess.datetime,
        task: remmess
      }, {
        headers: {
          Authorization: `Bearer ${jwt}`
        },
      });
      inputField.value = "";
    }

    try {
      const res = await axios.post('https://jarvis-ai-8pr6.onrender.com/api/gemini', {
        prompt: message,
        conversationId: userid,
        username: usersname
      }, {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      });
      let cleanbotMessageText = res.data.response.startsWith('JARVIS:')
        ? res.data.response.replace('JARVIS:', '')
        : res.data.response;
      let botMessageText = formatGeminiResponse(cleanbotMessageText);
      const botMessage = { sender: 'bot', message: botMessageText, time: time };
      const savebotMessage = { sender: 'bot', message: cleanbotMessageText , time: time };
      setMessages((prev) => [...prev, botMessage]);
      if (ison) {
        const speakableres = res.data.response.replace(/<\/?p[^>]*>/gi, '');;
        speak(speakableres);
      }
      saveData(savebotMessage, userid);
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
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      console.log("Heard:", transcript);
      document.getElementById('input').value = transcript;
      getResponse();
      recognition.stop();
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      console.log("Speech recognition stopped. Restarting...");
    };
  };







  const resetChat = async () => {
    const deletechat = await axios.post(`https://jarvis-ai-8pr6.onrender.com/convoss/${usersname}`, {}, {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    });
    setMessages([]);
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleNav = () => {
    navRef.current.classList.toggle('hammy');
  };

  useEffect(() => {
    const storedId = localStorage.getItem('userid');
    if (storedId) {
      setUserid(storedId);
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
      <video autoPlay loop muted poster={postImg} id='bgVideo'>
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
          <p id='info'>i<p className='warning'> Uses Google Gemini. AI responses may be inaccurate or inappropriate. Inputs are stored for history purposes. Don’t enter personal info.</p></p>
        </nav>

        <div className='ham-burger' ref={navRef}>
          <p className='pow'>Powered by Gemini AI</p>
          <h1 onClick={toggleNav}><i class="fa-solid fa-xmark"></i></h1>
          <ul>
            <li><div className='voice-mode-toggle' onClick={() => { ison ? setIson(false) : setIson(true), document.querySelector('.voice-mode-toggle').classList.toggle('activate') }}>Voice-Mode</div></li>
            <li>
              <button onClick={() => { resetChat(); toggleNav(); }}>DELETE CHAT</button>
            </li>
            <li>
              <a href='https://jram-18.netlify.app/#about'>CREATOR</a>
            </li>
            <li onClick={() => { document.getElementById("Confirm").classList.toggle("act") }}><div className="Logout" id='Logout' >Log Out</div></li>
            <li><div className="Confirm" id='Confirm'>
              <h1>Log Out</h1>
              <p>Are you Sure?</p>
              <div className="Log-buttons">
                <button className='btn-1' onClick={() => { document.getElementById("Confirm").classList.toggle("act") }}>No</button>
                <button className='btn-2' onClick={Loggout}>Log Out</button>
              </div>
            </div></li>
          </ul>
        </div>

        <div className='chat' ref={chatRef}>
          <ul className='chat-list'>
            {messages.map((msg, index) => (
              <li key={index} className={msg.sender}>
                <span dangerouslySetInnerHTML={{ __html: msg.message }} />
                <p id='time'>{msg.time ? msg.time : null}</p>
              </li>
            ))}


            {loaderRef && (
              <div className='loader'>
                <img src={jarvisLogo} alt='Loading...' />
              </div>
            )}
          </ul>
        </div>
        <div className="task-wrapper">
          <Tasks tasks={taskbarName} />
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
          <p className='info '>i<p className='warning'> Uses Google Gemini. AI responses may be inaccurate or inappropriate. Inputs are stored for history purposes temporarily. Don’t enter personal info.</p></p>
        </div>
        {lazyLoader && <div className="lazy-loader">
          <ul>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
          </ul>
        </div>}
      </div>
    </div >
  );
};

export default AiPage;
