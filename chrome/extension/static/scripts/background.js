
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

var messageSendReminder = function(data) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { 
      action: 'reminder', 
      data: data, 
      type: 'reminder'
    });
  });
};

var messageSendTimeoutExpire = function(data) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { 
      action: 'timer_expire', 
      data: data, 
      type: 'expire'
    });
  });
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
      
      var timeLeft = expireDate.diff(moment());
    
      if (timeLeft > 0 && !isBrake) {
        var secondsLeft = parseInt(timeLeft / 1000);
        if (secondsLeft >= 15 && secondsLeft <= 30) {
          sendTimeoutExpire();
        }
        else if (secondsLeft >= 275 && secondsLeft <= 300) {
          sendReminder();
        }
        else if (secondsLeft >= 875 && secondsLeft <= 900) {
          sendReminder();
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

  var sendReminder = function() {
    var data = getTimer();
    messageSendReminder(data);
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