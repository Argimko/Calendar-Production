const { createApp, ref } = Vue;

const vm = createApp({
   setup() {
      const sizes = ref([
         { label: '29.7 x 14 см', value: [ 29.7, 14 ] },
      ]);
      
      const pageSize = ref(sizes.value[0].value);
      const loading = ref(false);
      const cutoff = ref(2);
      const daysOutside = ref(true);
      const weekNumbers = ref(true);
      const fontSize = ref(36);
      const bg = ref(null);

      return { pageSize, sizes, loading, cutoff, daysOutside, weekNumbers, fontSize, bg };
   },

   mounted() {
      try { this.pageSize = JSON.parse(localStorage['pageSize']) } finally { }

      let cutoff = Number(localStorage['cutoff']);
      if (!isNaN(cutoff)) 
         this.cutoff = cutoff;

      let fontSize = Number(localStorage['fontSize']);
      if (!isNaN(fontSize)) 
         this.fontSize = fontSize;

      this.daysOutside = localStorage['daysOutside'] != 'false';
      this.weekNumbers = localStorage['weekNumbers'] != 'false';

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
               file && (this.bg = URL.createObjectURL(file));
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
      },
      daysOutside(value) {
         localStorage['daysOutside'] = value;
      },
      fontSize(value) {
         localStorage['fontSize'] = value;
      },
      weekNumbers(value) {
         localStorage['weekNumbers'] = value;
      }
   },

   computed: {
      bgUrl() {
         return this.bg && `url(${this.bg})`;
      }
   },

   methods: {
      printPage() {
         this.loading = true;
         setTimeout(() => {
            this.loading = false;
            queueMicrotask(window.print);
         }, 500);
      },
      bgSelect(event) {
         this.bg = event.files[0].objectURL;
         this.db?.putItem('bg', event.files[0]);
      },
      bgClear() {
         this.bg = null;
         this.db?.deleteItem('bg');
      },
      t(event) {
         
      }
   },

   components: {
      'p-button': primevue.button,
      'p-dropdown': primevue.dropdown,
      'p-fileupload': primevue.fileupload,
      'p-inputnumber': primevue.inputnumber,
      'p-inputswitch': primevue.inputswitch,
   }
});

// Locale - https://primevue.org/configuration/#locale - https://unpkg.com/primelocale/ru.json
// Single HTML - https://stackblitz.com/edit/web-platform-dwzmk2?file=index.html
vm.use(primevue.config.default, { ripple: true })
vm.mount('#app');
