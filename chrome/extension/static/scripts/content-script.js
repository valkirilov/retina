
chrome.runtime.sendMessage({ method: "get_timer"}, function(response) {
  RetinaExtensionContentScript.init(response.data);
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  switch(message.action) {
    case 'open':
    case 'reminder':
    case 'timer_expire':
      RetinaExtensionContentScript.open(message.data, message.type);
      break;
  }
});

var messageStartTimer  = function(data) {
  chrome.runtime.sendMessage({ 
    method: "set_timer",
    data: data
  }, function(response) {
  });
};


var RetinaExtensionContentScript = (function() {

  var retinaElement;

  var init = function(data) {
    retinaElement = RetinaExtension.init(data); 

    document.body.appendChild(retinaElement);
  };

  var open = function(data, type) {

    RetinaExtension.setTimer(data);
    RetinaExtension.setType('pinned');
    RetinaExtension.open(type);

  };

  var setTimer = function(data) {
    messageStartTimer(data);
  };

  return {
    init: init,
    open: open,
    setTimer: setTimer
  };

})();
