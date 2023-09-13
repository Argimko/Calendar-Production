const { createApp, ref } = Vue;

const vm = createApp({
   setup() {
      const sizes = ref([
         { label: 'A4', value: [ 29.7, 21 ] },
         { label: '20 x 10 см', value: [ 20, 10 ] },
         { label: '36 x 24 см', value: [ 36, 24 ] },
      ]);
      
      const pageSize = ref(sizes.value[0].value);
      const loading = ref(false);
      const cutoff = ref(2);

      return { pageSize, sizes, loading, cutoff };
   },

   mounted() {
      try { this.pageSize = JSON.parse(localStorage['pageSize']) } finally { }

      const cutoff = Number(localStorage['cutoff']);
      if (!isNaN(cutoff)) 
         this.cutoff = cutoff;

      // IndexedDB:
      //    https://learn.javascript.ru/indexeddb
      //    https://hacks.mozilla.org/2012/02/storing-images-and-files-in-indexeddb/
      const request = indexedDB.open('calendar');
      const storeName = 'files';
      request.onupgradeneeded = ({target: {result: db}}) => db.createObjectStore(storeName);
      request.onsuccess = ({target: {result: db}}) => {
         if (db.objectStoreNames.contains(storeName)) {
            const store = mode => db.transaction(storeName, mode).objectStore(storeName);

            this.db = {
               putItem: (key, value) => store('readwrite').put(value, key),
               deleteItem: (key) => store('readwrite').delete(key)
            }

            store().get('bg').onsuccess = ({target: {result: file}}) =>
               file && document.getElementById('calendar').style.setProperty('--bg', `url(${URL.createObjectURL(file)})`);
         }
         else {
            indexedDB.deleteDatabase(db.name);
         }
      }
   },
   
   watch: {
      cutoff(value) {
         localStorage['cutoff'] = value;
      },
      pageSize(value) {
         document.getElementById('pageSize').textContent = `@page { size: ${value[0]}cm ${value[1]}cm }`;
         localStorage['pageSize'] = JSON.stringify(value);
      }
   },
   
   components: {
      'p-button': primevue.button,
      'p-dropdown': primevue.dropdown,
      'p-fileupload': primevue.fileupload,
      'p-inputnumber': primevue.inputnumber,
   },

   methods: {
      printPage() {
         this.loading = true;
         setTimeout(() => {
            this.loading = false;
            queueMicrotask(window.print);
         }, 500);
      },
      bgSelected(event) {
         const style = document.getElementById('calendar').style;

         if (event) {
            style.setProperty('--bg', `url(${event.files[0].objectURL})`);
            let label = event.originalEvent.target.previousSibling;
            queueMicrotask(() => label.textContent = 'Очистить');
            this.db?.putItem('bg', event.files[0]);
         }
         else {
            style.removeProperty('--bg');
            this.db?.deleteItem('bg');
         }
      },
   },
})
.use(primevue.config.default, { ripple: true })  // https://stackblitz.com/edit/web-platform-dwzmk2?file=index.html
.mount('#app');

// Locale: 
//    https://primevue.org/configuration/#locale
//    https://unpkg.com/primelocale/ru.json
