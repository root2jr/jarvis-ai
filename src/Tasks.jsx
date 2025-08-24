import React, { useEffect, useState } from 'react'
import './task.css'
import axios from 'axios';

const Tasks = ({ tasks }) => {

  const [task, setTask] = useState([]);


  useEffect(() => {
    if(tasks) setTask(tasks);
  }, [tasks])


  function taskclose() {
    let TaskbarToggle = document.getElementById('taskbar');
    TaskbarToggle.classList.toggle("tasktoggle");
  }

  const remove_task = async (task) => {
    const updated = tasks.filter(prev => prev.task !== task)
    setTask(updated);
    try {
      const response = await axios.post("https://jarvis-ai-8pr6.onrender.com/removetasks", {
        task: task
      });
    }
    catch (error) {
      console.error("Error:", error);
    }
  }



  return (
    <div className='Task-bar' id='taskbar'>
      <div className="nav-task">
        <h1>Task-Bar</h1>
        <p onClick={taskclose}><i class="fa-solid fa-xmark"></i></p>
      </div>
      <ul>
        {task ? task.map((task, index) => (
          <li key={index}>
            <div>{task.task}</div>
            <p onClick={() => remove_task(task.task)} style={{ color: "red" }}><i class="fa-solid fa-trash-can"></i></p>
          </li>
        )) : null}

      </ul>
    </div>
  )
}

export default Tasks