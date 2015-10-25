
var extension = {
  dom: {
    element: {
      id: 'retina-extension-d08061708cf2e5299af9ae0b609a376a'
    },
    timer: {
      id: 'retina-timer'
    },
    timerActivator: {
      id: 'retina-timer-activator',
      buttonId: 'retina-timer-activator-button'
    },
    animations: {
      open: 'flipInX',
      close: 'flipOutX',
      expire: 'wobble',
      reminder: 'pulse',
    }
  }
};

/**
 * Short allias for a function which is adding a class name to a specific element
 * @param {HtmlElement}
 * @param {string}
 */
function addClass(element, className) {
  if (element.className.indexOf(className) > -1) {
    return;
  }

  element.className += ' ' + className;
}

/**
 * Short allias for a function which is removing a class name to a specific element
 * @param {HtmlElement}
 * @param {string}
 */
function removeClass(element, className) {
  if (element.className.indexOf(className) === -1) {
    return;
  }

  element.className = element.className.replace(new RegExp(className, 'g'), '');
}