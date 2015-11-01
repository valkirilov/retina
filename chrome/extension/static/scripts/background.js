
chrome.browserAction.onClicked.addListener(function(tab) {
 
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var data = RetinaExtensionBackground.getTimer();

    chrome.tabs.sendMessage(tabs[0].id, { 
      action: 'open', 
      data: data, 
      type: 'open'
    });
  });

});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.method == 'get_timer') {
    var data = RetinaExtensionBackground.getTimer();
    sendResponse({'data': data});
  }

  if (request.method == 'set_timer') {
    RetinaExtensionBackground.setTimer(request.data);
    sendResponse({'message': true});
  }
});

var inFocus = true;  // global boolean to keep track of state
chrome.windows.onFocusChanged.addListener(function(window) {
  if (window == chrome.windows.WINDOW_ID_NONE) {
    inFocus = false;
  }
  else {
    inFocus = true;
  }
});

var messageSendTimeoutExpire = function(data) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    sendNotificationExpire(data);
    if (tabs[0] ) {
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'timer_expire', 
        data: data, 
        type: 'expire'
      });  
    }
  });
};

var RetinaExtensionBackground = (function() {

  var startDate;
  var expireDate;
  var TIMEOUT_CHECK = 1000;

  var currentTimeout;

  var notifications = {
    notification1: false,
    notification2: false,
    notification3: false,
  };

  var isBrake = false;

  var init = function() {
    startDate = moment();
    expireDate = moment();

    timeoutExpired();
  };

  var timeoutExpired = function() {

    currentTimeout = setTimeout(function() {

      //sendNotificationReminder();
      
      var timeLeft = expireDate.diff(moment());
      var timeLeftType = 'green';

      if (timeLeft > 0 && !isBrake) {
        var secondsLeft = parseInt(timeLeft / 1000);
        if (secondsLeft <= 30) {
          sendTimeoutExpire();
          timeLeftType = 'red';
        }
        else if (secondsLeft <= 300) {
          sendReminder('5');
          timeLeftType = 'orange';
        }
        else if (secondsLeft <= 900) {
          sendReminder('15');
          timeLeftType = 'yellow';
        }
      }

      updateBadge(timeLeft, timeLeftType);

      timeoutExpired();
    }, TIMEOUT_CHECK);

  };

  var getTimer = function() {
    return {
      startDate: startDate.format(),
      expireDate: expireDate.format()
    };
  };

  var setTimer = function(data) {
    startDate = moment(data.startDate);
    expireDate = moment(data.expireDate);

    // Reset the notifications
    notifications = {
      notification1: false,
      notification2: false,
      notification3: false,
    };

    isBrake = false;

    if (data.isBrake) {
      isBrake = true;
      sendNotificationRest();
    }
    else {
      sendNotificationStart(); 
    }

    updateBadge(expireDate.diff(moment()), 'green');
  };

  var sendReminder = function(minutes) {
    var data = getTimer();
    //messageSendReminder(data, minutes);
  };

  var messageSendReminder = function(data, minutes) {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      sendNotificationReminder(minutes);
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'reminder', 
          data: data, 
          type: 'reminder'
        });
      }
    });
  };

  var sendTimeoutExpire = function() {
    var data = getTimer();
    messageSendTimeoutExpire(data);
  };

  var updateBadge = function(time, type) {
    chrome.browserAction.setBadgeText({
      text: moment(time).format(' mm ')
    });

    if (isBrake) {
      type = 'blue';
    }

    var color;
    switch(type) {
      case 'green':
        chrome.browserAction.setIcon({ path: chrome.extension.getURL('static/images/logo/logo-green.png')});
        color = '#2ECC40'; 
        break;
      case 'yellow':
        chrome.browserAction.setIcon({ path: chrome.extension.getURL('static/images/logo/logo-yellow.png')});
        color = '#FFDC00'; 
        break;
      case 'orange':
        chrome.browserAction.setIcon({ path: chrome.extension.getURL('static/images/logo/logo-orange.png')});
        color = '#FF851B'; 
        break;
      case 'red':
        chrome.browserAction.setIcon({ path: chrome.extension.getURL('static/images/logo/logo-red.png')});
        color = '#FF4136'; 
        break;
      case 'blue':
        chrome.browserAction.setIcon({ path: chrome.extension.getURL('static/images/logo/logo-blue.png')});
        color = '#001F3F'; 
        break;
    }
    chrome.browserAction.setBadgeBackgroundColor({
      color: color
    });
  };

  var sendNotificationStart = function(data) {
    createNotification({
      id: 'start',
      iconUrl: chrome.extension.getURL('static/images/notifications/retina-start.png'),
      type: 'basic',
      title: 'New timer started',
      message: 'Keep yourself focused, go to work again',
      priority: 1,
    });

    playAudioNotification();
  };

  var sendNotificationRest = function(data) {
    createNotification({
      id: 'rest',
      iconUrl: chrome.extension.getURL('static/images/notifications/retina-rest.png'),
      type: 'basic',
      title: 'Time for rest',
      message: 'Stop working and take the rest that you decerved',
      priority: 1,
    });
    playAudioNotification();
  };

  var sendNotificationReminder = function(minutes) {

    var options = {
      id: 'reminder',
      type: 'basic',
      title: 'Retina reminds you',
      priority: 1,
    };

    if (minutes === '15') {
      if (notifications.notification1) {
        return;
      }
      notifications.notification1 = true;
      options.iconUrl = chrome.extension.getURL('static/images/notifications/retina-reminder1.png');
      options.message = 'Keep yourself focused, the next break is close';
    }
    else if (minutes === '5') {
      if (notifications.notification2) {
        return;
      }
      notifications.notification2 = true;
      options.iconUrl = chrome.extension.getURL('static/images/notifications/retina-reminder2.png');
      options.message = 'Keep yourself focused, the next break is close';
    }

    createNotification(options);
    playAudioNotification();
  };

  var sendNotificationExpire = function(data) {
    if (notifications.notification3) {
      return;
    }

    notifications.notification3 = true;
    createNotification({
      id: 'expire',
      iconUrl: chrome.extension.getURL('static/images/notifications/retina-reminder3.png'),
      type: 'basic',
      title: 'Retina reminds you',
      message: 'Keep yourself focused, the next break is close',
      priority: 1,
    });

    playAudioNotification();
  };

  var createNotification = function(data) {
    var options = {
      iconUrl:  data.iconUrl,
      type:     data.type,
      title:    data.title,
      message:  data.message,
      priority: 1,
    };

    chrome.notifications.create('retina-notification-' + data.id, options, function(id) { 
      console.log("Last error:", chrome.runtime.lastError); 
    });
  };

  var playAudioNotification = function(){
    var notificationSoundAlert = new Audio(chrome.extension.getURL('static/sounds/alert1.wav'));
    var notificationSoundTick = new Audio(chrome.extension.getURL('static/sounds/tick.wav'));

    notificationSoundAlert.play();
    notificationSoundTick.play();
  };

  return {
    init: init,
    getTimer: getTimer,
    setTimer: setTimer
  };
})();

RetinaExtensionBackground.init();