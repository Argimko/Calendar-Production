const { createApp, ref } = Vue;

const vm = createApp({
   setup() {
      const sizes = ref([
         { label: '29.7 x 14 см', value: [ 29.7, 14 ] },
      ]);
      
      const cutoff = ref(Number(localStorage['cutoff']));
      if (isNaN(cutoff.value)) 
         cutoff.value = 2;
      
      const pageSize = ref(sizes.value[0].value);
      try { pageSize.value = JSON.parse(localStorage['pageSize']) } catch { /* pass */ }

      const printLoading = ref(false);
      const daysOutside = ref(localStorage['daysOutside'] != 'false');
      const weekNumbers = ref(localStorage['weekNumbers'] != 'false');
      const yearNumber = ref(localStorage['yearNumber'] == 'true');
      const fontSize = ref(Number(localStorage['fontSize']));
      const bg = ref(null);

      return { pageSize, sizes, printLoading, cutoff, daysOutside, weekNumbers, yearNumber, fontSize, bg };
   },

   mounted() {
      this.updatePageSize();
      if (!this.fontSize)
         this.updateFontSize();

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
      cutoff      : value => localStorage['cutoff'] = value,
      daysOutside : value => localStorage['daysOutside'] = value,
      fontSize    : value => localStorage['fontSize'] = value,
      weekNumbers : value => localStorage['weekNumbers'] = value,
      yearNumber  : value => localStorage['yearNumber'] = value,
      pageSize(value) {
         this.updateFontSize();
         this.updatePageSize();
         localStorage['pageSize'] = JSON.stringify(value);
      },
   },

   computed: {
      bgUrl() {
         return this.bg && `url(${this.bg})`;
      },
   },

   methods: {
      printPage() {
         this.printLoading = true;
         setTimeout(() => {
            this.printLoading = false;
            document.title = `Календарь на ${document.getElementById('calendar_preview_year').dataset.year} год`;
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
      updateFontSize() {
         this.fontSize = Math.floor(this.pageSize[1] * 2.6);
      },
      updatePageSize() {
         document.getElementById('pageSize').textContent = `@page { size: ${this.pageSize[0]}cm ${this.pageSize[1]}cm }`;
      },
      openDropdown(event) {
         event.target.firstElementChild.click();
      },
      updateModel(event) {
         if (event.originalEvent instanceof KeyboardEvent) {
            const target = event.originalEvent.target;
            const proxy = target.parentNode.__vnode.ctx.proxy;

            if (event.value == proxy.validateValue(event.value))
               proxy.onInputKeyDown({ code: 'Enter', target: target });
         }
      },
      selectAll(event) {
         if (event.target instanceof HTMLInputElement && event.detail == 2)
            event.target.select();
      },
   },

   components: {
      'p-button': primevue.button,
      'p-dropdown': primevue.dropdown,
      'p-fileupload': primevue.fileupload,
      'p-inputnumber': primevue.inputnumber,
      'p-inputswitch': primevue.inputswitch,
   }
})
.use(primevue.config.default, { ripple: true, pt: {
   inputnumber: { input: { name: 'none' } },
   inputswitch: { hiddenInput: { name: 'none' } },
}})
.mount('#app');
