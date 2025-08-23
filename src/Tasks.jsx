import React from 'react'
import './task.css'

const Tasks = ({tasks}) => {

  function taskclose() {
    let TaskbarToggle = document.getElementById('taskbar');
    TaskbarToggle.classList.toggle("tasktoggle");
  }




  return (
    <div className='Task-bar' id='taskbar'>
      <div className="nav-task">
        <h1>Task-Bar</h1>
        <p onClick={taskclose}><i class="fa-solid fa-xmark"></i></p>
      </div>
      <ul>
        {tasks? tasks.map((task, index) => (
          <li key={index}>
            <div>{(task.task)}</div>
          </li>
        )):null}

      </ul>
    </div>
  )
}

export default Tasks