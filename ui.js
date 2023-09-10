document.addEventListener('DOMContentLoaded', () => {
   document.getElementById('bgButton').addEventListener('change', event => {
      // document.body.style.backgroundImage = `url('./background/${event.target.files[0].name}')`;
      document.getElementById('calendar').style.setProperty('--bg', `url('./background/${event.target.files[0].name}')`)
   }
   )
});
