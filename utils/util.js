const formatTime = (date, delimiter = '/') => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join(delimiter) + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

//todate默认参数是当前日期，可以传入对应时间 todate格式为2018-10-05
function getDates(todate, days = 0) {
  if (days) {
    var dateArry = [];
    for (var i = 0; i < days; i++) {
      var dateObj = dateLater(todate, i);
      dateArry.push(dateObj)
    }
    return dateArry;
  } else {
    return dateLater(todate, 0);
  }

}
function dateLater(dates, later) {
  let dateObj = {};
  let show_day = new Array('周日', '周一', '周二', '周三', '周四', '周五', '周六');
  let date = new Date(dates);
  date.setDate(date.getDate() + later);
  let day = date.getDay();
  let yearDate = date.getFullYear();
  let month = ((date.getMonth() + 1) < 10 ? ("0" + (date.getMonth() + 1)) : date.getMonth() + 1);
  let dayFormate = (date.getDate() < 10 ? ("0" + date.getDate()) : date.getDate());
  let hourFormate = (date.getHours() < 10 ? ("0" + date.getHours()) : date.getHours());
  let minuteFormate = (date.getMinutes() < 10 ? ("0" + date.getMinutes()) : date.getMinutes());
  let secondFormate = (date.getSeconds() < 10 ? ("0" + date.getSeconds()) : date.getSeconds());
  dateObj.date = yearDate + '-' + month + '-' + dayFormate;
  dateObj.week = show_day[day];
  dateObj.day = parseInt(dayFormate);
  dateObj.month = parseInt(month);
  dateObj.time = hourFormate + ':' + minuteFormate;
  return dateObj;
}

function today() {
  return getDates(formatTime(new Date()))
}

module.exports = {
  formatTime: formatTime,
  getDates: getDates,
  dateLater: dateLater,
  today: today
}
