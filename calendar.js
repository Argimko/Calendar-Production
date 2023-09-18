/**
 * Vanilla Calendar - https://vanilla-calendar.com/docs/reference/additionally/settings
 */

// Обработка ошибок
function showError(msg) {
   msg = msg.replaceAll('holidays.js', '<i><a href="holidays.js" target="_blank">holidays.js</a></i>');
   document.getElementById('toast').insertAdjacentHTML('beforeend', `<div class="warn">❗ ${msg}</div>`);
};

document.addEventListener('DOMContentLoaded', () => {
   let startDate = new Date();
   if (startDate.getMonth() > 7) {
      // Если текущий месяц больше 7 (сентябрь или позднее), то год увеличивается на 1
      // Счёт месяцев начинается с 0
      startDate = new Date(startDate.getFullYear() + 1, 0);
   }
   else {
      // Иначе месяц устанавливается в 0 (январь)
      startDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1);
   }
   
   // Настройки
   const options = {
      type: 'multiple',          // Тип выводимого календаря: default, multiple, month, year
      months: 12,                // Количество месяцев для отображения (от 2 до 12), если тип календаря: 'multiple'

      settings: {
         lang: 'ru',             // Языковая локализация календаря
         visibility: {
            today: false,        // Не выделять сегодняшний день
            weekNumbers: true,   // Показать номера недель в году
            daysOutside: true,   // Показать дни прошлого и следующего месяца
            weekend: false,      // СБ может является рабочим днём - отключаем подсветку СБ и ВС, выходные заданы в holidays
            theme: 'light'
         },

         selection: {
            day: false,          // Отключить выбор дней
            year: false          // Отключить выбор года
         },

         selected: {
            year: startDate.getFullYear(),   // Год, отображаемый при инициализации календаря
            month: startDate.getMonth(),     // Месяц от 0 до 11
            holidays: holidays               // Выходные и праздничные дни
         },
      }
   };

   // Теперь давайте создадим экземпляр календаря с заданными параметрами
   const calendar = new VanillaCalendar('#calendar', options)
   calendar.init();

   // Добавляем справа от месяца вторую колонку с номерами недель
   Array.from(document.getElementsByClassName('vanilla-calendar-week-numbers')).forEach(n => n.parentNode.append(n.cloneNode(true)));

   // Выводим отображаемые года на странице и в заголовке для сверки
   const endDate = new Date(calendar.selectedYear, calendar.selectedMonth + calendar.correctMonths, 0);
   let yearsText = String(calendar.selectedYear);
   if (endDate.getFullYear() != calendar.selectedYear)
      yearsText += `-${endDate.getFullYear()}`;

   // Устанавливаем значение года календаря внизу страницы для сверки
   document.getElementById('calendar_preview_year').dataset.year = yearsText;

   // Проверка: Значение года в document.title и h1
   if (!document.title.includes(startDate.getFullYear()) || document.getElementById('header_year').textContent != startDate.getFullYear())
      showError('Значения года в HTML <i>document.title, #header_year</i> должны быть равны <i>startDate.getFullYear()</i>');

   // Считаем количество отображаемых выходных
   startDate = new Date(calendar.selectedYear, calendar.selectedMonth);
   let displayHolidaysCount = calendar.selectedHolidays.filter(d => {
      const date = new Date(`${d}T00:00:00`);
      return date >= startDate && date <= endDate;
   }).length;

   // Проверка: Опция [settings.visibility.weekend] должна быть отключена
   if (calendar.settings.visibility.weekend) {
      showError(`Суббота может является рабочим днём – рекомендуется отключить подсветку СБ и ВС ` +
                `[<a href="https://vanilla-calendar.com/ru/docs/reference/additionally/settings#visibility-weekend" target="_blank">settings.visibility.weekend</a>] и задать выходные в holidays.js`);
   }
   
   // Проверка: Количество выходных дней в файле holidays.js должно быть равно количеству отображаемых выходных в календаре
   else if (displayHolidaysCount != holidays.length) {
      showError(`Количество выходных дней в файле holidays.js [${holidays.length}] не равно количеству отображаемых выходных в календаре [${displayHolidaysCount}]`);
   }
   
   // Проверка: Количество отображаемых выходных дней в каждом месяце должно быть больше или равно 7
   else if (displayHolidaysCount < 7 * calendar.correctMonths) {
      showError(`Подозрительно малое количество отображаемых выходных дней [${displayHolidaysCount}]. Проверьте список выходных в файле holidays.js [${holidays.length}]`);
   }

   // Проверка наличия обновлённого списка выходных на GitHub
   if (startDate.getFullYear() == endDate.getFullYear()) {
      let holidaysUrl = `https://raw.githubusercontent.com/d10xa/holidays-calendar/master/json/consultant${startDate.getFullYear()}.json`;

      fetch(holidaysUrl).then(response => response.json()).then(remote => {
         if (remote.holidays.length != holidays.length || remote.holidays.find((remoteHoliday, index) => remoteHoliday != holidays[index])) {
            showError(`Данные в файле holidays.js [${holidays.length}] отличаются от ` +
                      `<a href="https://github.com/d10xa/holidays-calendar" target="_blank">производственного календаря на GitHub</a> [${remote.holidays.length}]`);
         }
      }, error => showError(`Не удалось загрузить список выходных и праздничных дней с <a href="${holidaysUrl}" target="_blank">GitHub</a>`));
   }
   
   // Отобразить страницу - эта строка выполнится если код выше корректен
   // document.body.removeAttribute('style');
});