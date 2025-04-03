import React, { useEffect, useRef, useState } from 'react';
import './AiPage.css';
import aiBg from './4872-181170832.mp4';
import axios from 'axios';
import jarvisLogo from './jarvis-logo.jpg';
import Tasks from './Tasks';
import * as chrono from "chrono-node";
import { io } from 'socket.io-client'

const socket = io("http://localhost:5000/");


const AiPage = () => {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/background.js')
            .then(reg => console.log('✅ Service Worker Registered:', reg))
            .catch(err => console.error('❌ Service Worker Error:', err));
    }

    const channel = new BroadcastChannel('jarvis_channel');
    channel.onmessage = (event) => {
        if (event.data.type === 'speak') {
            speak(event.data.text);
        }
    };
    socket.on("reminder_audio", (data) => {
      const { filename } = data;
      console.log(data);
      const audio = new Audio(filename);
    
      let playCount = 0; // 🔢 Track how many times it played
      const maxPlays = 5; // 🔁 Play it 5 times
    
      const playAudio = () => {
        if (playCount < maxPlays) {
          audio.currentTime = 0; // ⏪ Reset audio position
          audio.play()
            .then(() => console.log(`🎵 Playing reminder audio... (${playCount + 1}/${maxPlays})`))
            .catch(err => console.error("❌ Error playing audio:", err));
          
          playCount++; // ➕ Increase play count
        } else {
          console.log(`✅ Audio played ${maxPlays} times.`);
        }
      };
    
      // 🔄 Play the first time
      playAudio();
    
      // 🔁 Loop until it reaches 5 plays
      audio.onended = () => {
        if (playCount < maxPlays) {
          playAudio();
        } else {
          console.log(`🗑 Audio file ${filename} played 5 times.`);
        }
      };
    });
    

    return () => {
      channel.close();
      socket.off("reminder_audio");
    };
  }, []); 


  const usersname = localStorage.getItem('usersmail');
  useEffect(() => {
    if (!usersname) {
      localStorage.clear();
    }
    console.log(usersname);
  }, [])

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

  function keepAudioAlive() {
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(audioContext.destination); // Keeps WebRTC alive
    })
    .catch(err => console.error('Mic Access Denied:', err));
}

function speak(text) {
  if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'speak', text });
  } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1; 
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
  }
}










  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const [userid, setUserid] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'user', message: "Wake Up J.A.R.V.I.S, Daddy's Home" },
    { sender: 'bot', message: "Welcome Home Sir, What are we going to work on today?" },
  ]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`https://jarvis-ai-8pr6.onrender.com/conversations/${usersname}`);
        if (res) {
          if (Array.isArray(res.data.messages)) {

            setMessages(res.data.messages);
          } else {
            console.error("messages is not an array:", res.data.messages);
            setMessages([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch saved messages:', err);
      }
    };
    fetchMessages();
  }, []);

  const [loaderRef, setLoaderRef] = useState(false);

  const chatRef = useRef(null);
  const navRef = useRef(null);

  const saveData = async (message, conversationId) => {
    const timestamp = new Date().toISOString();
    const requests = [];


    requests.push(
      axios.post('https://jarvis-ai-8pr6.onrender.com/conversations', {
        sender: message.sender,
        message: message.message,
        timestamp,
        username: usersname,
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
    console.log(parsedDate);
    if (parsedDate) {
        datetime = parsedDate.toISOString();
        const chronoResult = chrono.parse(text);
        console.log(chronoResult);
        if (chronoResult.length > 0) {
            text = text.replace(chronoResult[0].text, "").trim(); 
        }
    }

    task = text.replace(/remind me to|set me a reminder to|alert me about|remind me that/, "").trim();
    
    console.log({intent, task, datetime});
    return { intent, task, datetime };
}
function parseTasks(text) {
    let intent = "task"; 
    let task = "";
    let datetime = null;

    const parsedDate = chrono.parseDate(text);
    console.log(parsedDate);
    if (parsedDate) {
        datetime = parsedDate.toISOString();
        const chronoResult = chrono.parse(text);
        console.log(chronoResult);
        if (chronoResult.length > 0) {
            text = text.replace(chronoResult[0].text, "").trim(); 
        }
    }

    task = text.replace(/"add task|note down|remember to |schedule me/, "").trim();
    
    console.log({intent, task, datetime});
    return { intent, task, datetime };
}





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
    if (message == "clear tasks") {
      setTaskbarName([{ type: 'task', text: '' }]);
    }
    const userMessage = { sender: 'user', message: message };
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
      
     const parsedmessa = parseTasks(message);
      const saveTaskdeadline = await axios.post("https://jarvis-ai-2.onrender.com/tasks", {
        username: usersname,
        intent: parsedmessa.intent,
        datetime: parsedmessa.datetime,
        task: parsedmessa.task
      })
      setTaskName(parsedmessa.task);
      setTaskbarName((prev) => [...prev, { type: 'task', message: parsedmessa.task }]);
      inputField.value = ""
      setMessages((prev) => [...prev, { message: "Task Added Successfully!" }]);
      const botMessage = { sender: 'bot', message: "Task Added Successfully!" };
      saveData(botMessage, userid)
    }
  


    else if (isReminderMessage(message)) {
      console.log("Reminder Detected");
      const parsedmess = parseReminder(message);
      const sendReminder = await axios.post("https://jarvis-ai-2.onrender.com/reminders", {
        username: usersname,
        intent: parsedmess.intent,
        datetime: parsedmess.datetime,
        task: parsedmess.task
      });
      inputField.value = "";
      const botMessage = { sender: 'bot', message: "Reminder is Set!" };
      saveData(botMessage, userid);
      setMessages((prev) => [...prev, { message: "Reminder is Set!" }]);
    }

    else {
      try {
        setLoaderRef(true);
        const res = await axios.post('https://jarvis-ai-8pr6.onrender.com/api/gemini', {
          prompt: message,
          conversationId: userid,
          username: usersname
        });
        let botMessageText = res.data.response.startsWith('JARVIS:')
          ? res.data.response.replace('JARVIS:', '')
          : res.data.response;
        botMessageText = formatGeminiResponse(botMessageText);
        const botMessage = { sender: 'bot', message: botMessageText };
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
    recognition.continuous = true; 
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log("Heard:", transcript);

        if (transcript.includes("hey jarvis")) {
            console.log("Wake word detected! Switching to Full-Power Mode.");
            enterFullPowerMode();
        } else if (transcript.includes("stop jarvis")) {
            console.log("Stopping JARVIS voice...");
            stopSpeaking();
        } else {
            document.getElementById('input').value = transcript;
            getResponse();
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
        console.log("Speech recognition stopped. Restarting...");
        startListening(); 
    };
};

const enterFullPowerMode = () => {
  console.log("Entering Full-Power Mode...");

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      console.log("Full-Power Mode Heard:", transcript);

      if (transcript.includes("stop jarvis")) {
          console.log("Stopping JARVIS voice...");
          stopSpeaking();
      } else {
          document.getElementById('input').value = transcript;
          getResponse();
      }
  };

  recognition.onerror = (event) => {
      console.error("Full-Power Mode error:", event.error);
  };

  recognition.onend = () => {
      console.log("Full-Power Mode stopped. Restarting Low-Power Mode...");
      startListening(); 
  };
};

const stopSpeaking = () => {
  if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      console.log("JARVIS Voice Stopped.");
  }
};


  const resetChat = async () => {
    const deletechat = await axios.post(`https://jarvis-ai-8pr6.onrender.com/convoss/${usersname}`)
    setMessages([
      { sender: 'user', message: "Wake Up J.A.R.V.I.S, Daddy's Home" },
      { sender: 'bot', message: "Welcome Home Sir, What are we going to work on today?" },
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
              <li key={index} className={msg.sender}>
                <span dangerouslySetInnerHTML={{ __html: msg.message }} />
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
    </div >
  );
};

export default AiPage;
