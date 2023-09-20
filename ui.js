const { createApp, ref } = Vue;

const vm = createApp({
   setup() {
      const sizes = ref([
         { label: '29.7 x 14 см', value: [ 297, 140 ] },
      ]);
      
      const cutoff = ref(Number(localStorage['cutoff']));
      if (isNaN(cutoff.value)) 
         cutoff.value = 2;
      
      const pageSize = ref(sizes.value[0].value);
      try { pageSize.value = JSON.parse(localStorage['pageSize']) } catch { /* pass */ }

      const weeksColorDef    = '878787';
      const weekDaysColorDef = '939393';

      const bg            = ref(null);
      const fontSize      = ref(Number(localStorage['fontSize']));
      const printLoading  = ref(false);
      const printDisabled = ref(false);
      const daysOutside   = ref(localStorage['daysOutside'] != 'false');
      const weekNumbers   = ref(localStorage['weekNumbers'] != 'false');
      const weeksColor    = ref(localStorage['weeksColor'] ?? weeksColorDef);
      const weekDaysColor = ref(localStorage['weekDaysColor'] ?? weekDaysColorDef);
      const yearNumber    = ref(localStorage['yearNumber'] == 'true');

      return { bg, fontSize, pageSize, sizes, printLoading, printDisabled, cutoff, daysOutside, 
               weekNumbers, weeksColor, weeksColorDef, weekDaysColor, weekDaysColorDef, yearNumber };
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
      cutoff        : value => localStorage['cutoff'] = value,
      daysOutside   : value => localStorage['daysOutside'] = value,
      fontSize      : value => localStorage['fontSize'] = value,
      weekNumbers   : value => localStorage['weekNumbers'] = value,
      weeksColor    : value => localStorage['weeksColor'] = value,
      weekDaysColor : value => localStorage['weekDaysColor'] = value,
      yearNumber    : value => localStorage['yearNumber'] = value,
      pageSize(value) {
         this.updateFontSize();
         this.updatePageSize();
         localStorage['pageSize'] = JSON.stringify(value);
      },
   },

   computed: {
      classParams() {
         return {
            'outside-days-disabled' : !this.daysOutside,
            'week-numbers-disabled' : !this.weekNumbers,
            'year-number-disabled'  : !this.yearNumber
         }
      },
      styleParams() {
         return {
            'font-size'         : this.fontSize + 'pt',
            '--bg'              : this.bg && `url(${this.bg})`,
            '--cutoff'          : this.cutoff + 'mm',
            '--page-width'      : this.pageSize[0] + 'mm',
            '--page-height'     : this.pageSize[1] + 'mm',
            '--weeks-color'     : '#' + this.weeksColor,
            '--week-days-color' : '#' + this.weekDaysColor,
         }
      }
   },

   methods: {
      printPage() {
         this.printLoading = true;
         document.title = `Календарь на ${document.getElementById('calendar_preview_year').dataset.year} год`;
         setTimeout(() => {
            this.printDisabled = true;
            this.printLoading = false;
            queueMicrotask(() => {
               window.print();
               this.printDisabled = false;
            });
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
         this.fontSize = Math.floor(this.pageSize[1] * 0.26);
      },
      updatePageSize() {
         document.getElementById('pageSize').textContent = `@page { size: ${this.pageSize[0]+this.cutoff*2}mm ${this.pageSize[1]+this.cutoff*2}mm }`;
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
      'p-button'      : primevue.button,
      'p-dropdown'    : primevue.dropdown,
      'p-colorpicker' : primevue.colorpicker,
      'p-fileupload'  : primevue.fileupload,
      'p-inputnumber' : primevue.inputnumber,
      'p-inputswitch' : primevue.inputswitch,
   }
})
.use(primevue.config.default, { ripple: true, pt: {
   colorpicker: { input: { name: 'none' } },
   inputnumber: { input: { name: 'none' } },
   inputswitch: { hiddenInput: { name: 'none' } },
}})
.mount('#app');
