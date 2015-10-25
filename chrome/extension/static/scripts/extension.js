
var RetinaExtension = (function() {
  
  var mainElement;

  var startDate;
  var expireDate;

  var timeoutClose;
  var timeoutTick;

  var isOpened = false;
  var isExpired = false;
  var isBrake = false;

  var init = function(data) {    
    setTimer(data);

    generateMarkup();

    privateActions();
    publicActions();

    return mainElement.get(0);
  };

  var setTimer = function(data) {
    startDate = moment(data.startDate);
    expireDate = moment(data.expireDate);
  };

  var generateMarkup = function() {

    mainElement = $('<div></div>');
    mainElement.attr('id', extension.dom.element.id);

    generateTimer();
    generateTimerActivator();

  };

  var generateTimer = function() {

    var timerElement = $('<div></div>');
    timerElement.attr('id', extension.dom.timer.id);
    timerElement.addClass('timer');

    mainElement.append(timerElement);
    calculateTimeLeft();
  };

  var generateTimerActivator = function() {
    var timerActivatorElement = $('<div></div>');
    timerActivatorElement.attr('id', extension.dom.timerActivator.id);
    timerActivatorElement.addClass('timer-activator');

    var timerActivatorButtonElement = $('<button></button>');
    timerActivatorButtonElement.attr('id', extension.dom.timerActivator.buttonId);
    timerActivatorButtonElement.html('Start');
    timerActivatorElement.append(timerActivatorButtonElement);

    mainElement.append(timerActivatorElement);
  };

  var calculateTimeLeft = function() {
    var timerElement = mainElement.find('#' + extension.dom.timer.id);
    var timerActivaotorElement = mainElement.find('#' + extension.dom.timerActivator.id);

    var timeLeft = expireDate.diff(moment());
    timerElement.html(moment(timeLeft).format('mm:ss'));

    if (timeLeft > 0) {
      timerElement.show();
      timerActivaotorElement.hide();

      if (timeLeft / 1000 <= 30) {
        setColor('color-timer-expired');
      }
      else if (timeLeft / 60000 <= 5) {
        setColor('color-timer-5minutes');
      }
      else if (timeLeft / 60000 <= 15) {
        setColor('color-timer-15minutes');
      }
      else if (timeLeft / 60000 > 15) {
        setColor('color-timer-start');
      }
    }
    else if (isOpened && isExpired && !isBrake) {
      isExpired = false;
      startBrake();
      toggle();
    }
    else if (isOpened && isBrake) {
      startTimer();
      toggle();
    }
    else {
      timerElement.hide();
      timerActivaotorElement.show();

      clearTimerTick();
      setColor('color-timer-default');
    }
  };

  var setType = function(type) {
    if (type === 'pinned') {
      setPinned();
    }
  };

  var setColor = function(color) {
    mainElement.removeClass('color-timer-default');
    mainElement.removeClass('color-timer-start');
    mainElement.removeClass('color-timer-15minutes');
    mainElement.removeClass('color-timer-5minutes');
    mainElement.removeClass('color-timer-expired');

    if (!isBrake) {
      mainElement.addClass(color);
    }
  };

  var setPinned = function() {
    mainElement.removeClass('fullscreen');
    mainElement.addClass('pinned');
  };

  var open = function(type) {
    if (isOpened) {
      return;
    }

    isOpened = true;

    if (type === 'expire') {
      addAnimation(mainElement, extension.dom.animations.expire);
      isExpired = true;
    }
    else if (type === 'remind') {
      addAnimation(mainElement, extension.dom.animations.reminder);
      setTimeoutClose();
    }
    else {
      addAnimation(mainElement, extension.dom.animations.open);
      setTimeoutClose();
    }
  };

  var expire = function() {
    addAnimation(mainElement, extension.dom.animations.expire);
  };

  var clearTimeoutClose = function() {
    clearTimeout(timeoutClose);
  };

  var setTimeoutClose = function() {
    clearTimeoutClose();
    timeoutClose = setTimeout(function() {
      close();
    }, 5000);
  };

  var startTimer = function() {

    startDate = moment();
    expireDate = moment().add('30', 'minutes');

    RetinaExtensionContentScript.setTimer({
      startDate: startDate.format(),
      expireDate: expireDate.format(),
    });

    var timerElement = mainElement.find('#' + extension.dom.timer.id);
    var timerActivaotorElement = mainElement.find('#' + extension.dom.timerActivator.id);

    calculateTimeLeft();
    timerElement.show();
    timerActivaotorElement.hide();
    setColor('color-timer-start');
    
    isExpired = false;
    isBrake = false;

    timerTick();
    setTimeoutClose();
  };

  var startBrake = function() {

    startDate = moment();
    expireDate = moment().add('5', 'minutes');

    RetinaExtensionContentScript.setTimer({
      startDate: startDate.format(),
      expireDate: expireDate.format(),
      isBrake: true
    });

    var timerElement = mainElement.find('#' + extension.dom.timer.id);
    var timerActivaotorElement = mainElement.find('#' + extension.dom.timerActivator.id);

    calculateTimeLeft();
    timerElement.show();
    timerActivaotorElement.hide();
    setColor('color-default');
    isExpired = false;
    isBrake = true;

    timerTick();
    setTimeoutClose();
  };

  var addAnimation = function(element, animation, callback) {
    element.addClass(animation);
    element.addClass('animated');

    $(element).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
      element.removeClass(animation);
      element.removeClass('animated');

      if (callback !== undefined) {
        callback();
      }
    });
  };

  var close = function() {
    addAnimation(mainElement, extension.dom.animations.close, function() {
      mainElement.removeClass('fullscreen');
      mainElement.removeClass('pinned');
    });

    isOpened = false;
  };

  var toggle = function() {
    if (mainElement.hasClass('pinned')) {
      clearTimeoutClose();
      mainElement.removeClass('pinned');
      mainElement.addClass('fullscreen');
    }
    else if (mainElement.hasClass('fullscreen')) {
      setTimeoutClose();
      mainElement.removeClass('fullscreen');
      mainElement.addClass('pinned'); 
    }
  };

  var publicActions = function() {
    
    mainElement.on('click', function(e) {
      e.preventDefault();
      setTimeoutClose();
    });

    mainElement.on('dblclick', function(e) {
      e.preventDefault();
      toggle();
    });

    mainElement.find('#' + extension.dom.timerActivator.id).on('click', function() {
      startTimer();
    });

  };

  var privateActions = function() {

    timerTick();

  };

  var timerTick = function() {
    timeoutTick = setTimeout(function() {
      calculateTimeLeft();
      timerTick();
    }, 1000);
  };

  var clearTimerTick = function() {
    clearTimeout(timeoutTick);
  };

  return {
    init: init,
    setTimer: setTimer,
    setType: setType,
    open: open,
    close: close
  };
})();