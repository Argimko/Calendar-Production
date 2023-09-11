document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('bgButton').addEventListener('change', event => {
        document.getElementById('calendar').style.setProperty('--bg', `url('./background/${event.target.files[0].name}')`);
    });
});

const { createApp, ref } = Vue;

const vm = createApp({
   setup() {
      const sizes = ref([
         { label: 'A4', value: [ 29.7, 21 ] },
         { label: '20 x 10 см', value: [ 20, 10 ] },
         { label: '36 x 24 см', value: [ 36, 24 ] },
      ]);
      
      const pageSize = ref(sizes.value[0].value);

      return { pageSize, sizes };
   },

   mounted() {
      // Check if the selectedWidth is saved in local storage and use it if available
      const pageSize = localStorage.getItem('pageSize');
      if (pageSize) {
         this.pageSize = JSON.parse(pageSize);
      }
   },
   
   watch: {
      pageSize(value) {
         document.getElementById('pageSize').textContent = `@page { size: ${value[0]}cm ${value[1]}cm }`;
         localStorage['pageSize'] = JSON.stringify(value);
      }
   },
   
   components: {
      'p-button': primevue.button,
      'p-dropdown': primevue.dropdown
   }
})
.use(primevue.config.default, { ripple: true })
.mount('#app');
