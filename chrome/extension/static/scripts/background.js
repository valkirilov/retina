
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

var sendNotificationReminder = function(minutes) {

  var options = {
    type: 'basic',
    title: 'Retina reminds you',
    priority: 1,
  };

  if (minutes === '15') {
    options.iconUrl = chrome.extension.getURL('static/images/retina-15.png');
    options.message = 'Keep yourself focused, the next break is close';
  }
  else if (minutes === '5') {
    options.iconUrl = chrome.extension.getURL('static/images/retina-5.png');
    options.message = 'Keep yourself focused, the next break is close';
  }

  chrome.notifications.create('retina-notification-reminder', options, function(id) { 
    console.log("Last error:", chrome.runtime.lastError); 
  });

  playAudioNotification();
};

var sendNotificationExpire = function(data) {

  var options = {
    iconUrl: chrome.extension.getURL('static/images/retina-030.png'),
    type: 'basic',
    title: 'Retina reminds you',
    message: 'Keep yourself focused, the next break is close',
    priority: 1,
  };

  chrome.notifications.create('retina-notification-expire', options, function(id) { 
    console.log("Last error:", chrome.runtime.lastError); 
  });

  playAudioNotification();
};

var playAudioNotification = function(){
  var notificationSoundAlert = new Audio(chrome.extension.getURL('static/sounds/alert1.wav'));
  var notificationSoundTick = new Audio(chrome.extension.getURL('static/sounds/tick.wav'));

  notificationSoundAlert.play();
  notificationSoundTick.play();
};

var RetinaExtensionBackground = (function() {

  var startDate;
  var expireDate;
  var TIMEOUT_CHECK = 15000;

  var currentTimeout;

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
    
      if (timeLeft > 0 && !isBrake) {
        var secondsLeft = parseInt(timeLeft / 1000);
        if (secondsLeft >= 15 && secondsLeft <= 30) {
          sendTimeoutExpire();
        }
        else if (secondsLeft >= 275 && secondsLeft <= 300) {
          sendReminder('5');
        }
        else if (secondsLeft >= 875 && secondsLeft <= 900) {
          sendReminder('15');
        }
      }

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

    isBrake = false;

    if (data.isBrake) {
      isBrake = true;
    }
  };

  var sendReminder = function(minutes) {
    var data = getTimer();
    messageSendReminder(data, minutes);
  };

  var sendTimeoutExpire = function() {
    var data = getTimer();
    messageSendTimeoutExpire(data);
  };

  return {
    init: init,
    getTimer: getTimer,
    setTimer: setTimer
  };
})();

RetinaExtensionBackground.init();