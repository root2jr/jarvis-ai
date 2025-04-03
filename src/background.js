self.addEventListener('message', (event) => {
    if (event.data.type === 'speak' && event.data.audio) {
      self.registration.showNotification("JARVIS Reminder", {
        body: "Playing reminder...",
        icon: "/logo.png",
      });
  
      fetch(event.data.audio)
        .then(response => response.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.play();
        })
        .catch(err => console.error("❌ Error playing audio:", err));
    }
  });
  