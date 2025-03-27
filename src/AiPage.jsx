import React, { useEffect, useRef, useState } from 'react';
import './AiPage.css';
import aiBg from './4872-181170832.mp4';
import axios from 'axios';
import jarvisLogo from './jarvis-logo.jpg';
import Tasks from './Tasks';

const AiPage = () => {
 
  const [name, setName] = useState('');
  const [taskbarName, setTaskbarName] = useState(() => {
    const stored = localStorage.getItem("tasks");
    return stored ? JSON.parse(stored) : [];
  });
  
  
  useEffect(() => {
    let storedTasks = localStorage.getItem("tasks");
    if (storedTasks) {
      setTaskbarName(JSON.parse(storedTasks));
      console.log(taskbarName);
    }
  }, [])

  useEffect(() => {
    const userfunc = async () => {
      const usernamee = await axios.get('https://jarvis-ai-1.onrender.com/username');
      const username = usernamee.data;
      setName(username);
      console.log(name);
    }
    userfunc();
  }, [])


  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(taskbarName));
  }, [taskbarName]);
  









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


    requests.push(
      axios.post('https://jarvis-ai-8pr6.onrender.com/conversations', {
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


  const reminderKeywords = [
    "remind me to",
    "remind me at",
    "set a reminder",
    "alert me to",
    "wake me at",
    "alarm for",
    "reminder:",
    "remind",
    "alert",
  ];
  const saveKeywords = [
    "add task",
    "note down",
    "remember to",
    "schedule",
    "set a task",
    "log this",
    "i need to",
    "save task",
    "track this",
    "task to do",
    "put this on my list",
    "i have to",
    "assign task"
  ];

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




  const [reminderName, setReminderName] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [taskName, setTaskName] = useState("");





  const getResponse = async () => {
    const inputField = document.getElementById('input');
    const message = inputField.value.trim();
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
    const userMessage = { type: 'user', text: message };
    setMessages((prev) => [...prev, userMessage]);
    saveData(userMessage, userid);
    const isReminderMessage = (message) => {
      return reminderKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
      );
    };
    const isTaskMessage = (message) => {
      return saveKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
      );
    };


    if (isTaskMessage(message)) {
      setMessages((prev) => [...prev, { text: "Use 'Tick:' in your prompt, So What actually is your task?" }]);
      inputField.value = ""
    }




    else if (message.toLowerCase().includes('tick:')) {
      const tName = message.slice(5).trim();
      setTaskName(tName);
      setTaskbarName((prev) => [...prev, { type: 'task', message: tName }]);
      console.log(taskbarName);
      setMessages((prev) => [...prev, { text: "Use 'Deadline:' in your prompt, So When actually is your Deadline?" }]);
      inputField.value = ""
    }
    else if (message.toLowerCase().includes("deadline:")) {
      const deadline = message.slice(9).trim();
      const saveTaskdeadline = await axios.post("https://jarvis-ai-2.onrender.com/tasks", {
        taskname: taskName,
        deadline: deadline
      })
      setMessages((prev) => [...prev, { text: "Task Added Successfully!" }]);
      inputField.value = ""
    }







    else if (message.toLowerCase().includes('name:')) {
      const summa = message.slice(5).trim();
      setReminderName(message.slice(5).trim());
      setMessages((prev) => [...prev, { text: "Use 'Time:' before the prompt! Time:" }]);
      inputField.value = "";
      const sendReminder = await axios.post("https://jarvis-ai-2.onrender.com/reminders", {
        name: summa,
        time: "",
      });
      const remdata = sendReminder.data;
      console.log(remdata)
    }
    else if (message.toLowerCase().includes('time:')) {
      const kamma = message.slice(5).trim();
      setReminderTime(message.slice(5).trim());
      setMessages((prev) => [...prev, { text: "Reminder is Set!" }]);
      inputField.value = ""
      const sendReminder = await axios.post("https://jarvis-ai-2.onrender.com/reminders", {
        name: reminderName,
        time: kamma
      });
      const remdata = sendReminder.data;
      console.log(remdata)

    }







    else if (isReminderMessage(message)) {
      console.log("Reminder Detected");
      let reminderName = "Use 'Name:' before the prompt What's the Reminder for?";
      setMessages((prev) => [...prev, { text: reminderName }]);
      inputField.value = ""
    }

    else {
      try {
        setLoaderRef(true);
        const res = await axios.post('https://jarvis-ai-8pr6.onrender.com/api/gemini', {
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
        </div>
      </div>
    </div>
  );
};

export default AiPage;
