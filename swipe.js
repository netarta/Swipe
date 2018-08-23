/*
 * !@license Swipe 3.0.5, Brad Birdsall Copyright 2013, licensed MIT License
 */

function Swipe(swipeContainer, options) {
  'use strict';

  var initialized, rendered, thisInstance, offloadFn, transitionEndEvt, hasTouchSupport, mouseEnabled, isMouseEvent, swipeWrap, slides, slidePos, width, length, index, speed, delay, interval, translate, move, setup, animate, slide, prev, next, circle, begin, stop, start, delta, events, isScrolling;
  if (!(this instanceof Swipe)) {
    return new Swipe(swipeContainer, options);
  }
  if (!swipeContainer) {
    return;
  }

  function hasClass(el, name) {
    if(el.classList && el.classList.contains && el.classList.contains(name)) {
      return true;
    }
    return (' ' + el.className + ' ').indexOf(' ' + name + ' ') >= 0;
  }
  
  function isSwipable(el) {
    var tagName = el.tagName;
    if (tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA' || tagName === 'CODE') {
      return false;
    }
    if (hasClass(el, 'no-swipe')) {
      return false;
    }
    if (hasClass(el, 'swipe-slide')) {
      return true;
    }
    while (el.parentNode) {
      el = el.parentNode;
      tagName = el.tagName;
      if (tagName === 'SELECT' || tagName === 'TEXTAREA' || tagName === 'CODE') {
        return false;
      }
      if (hasClass(el, 'no-swipe')) {
        return false;
      }
      if (hasClass(el, 'swipe-slide')) {
        return true;
      }
    }
    return true;
  }
  // thisInstance = this;
  options = options || Object.create(null);
  options.continuous = options.continuous !== undefined ? options.continuous : true;
  if (typeof options.startSlide === 'undefined') {
    index = 0;
  } else if (typeof options.startSlide === 'function') {
    index = options.startSlide() || 0;
  } else if (typeof options.startSlide === 'string') {
    index = parseInt(options.startSlide, 10) || 0;
  } else {
    index = options.startSlide || 0;
  }
  if (typeof index !== 'number' || !isFinite(index) || Math.floor(index) !== index) {
    index = 0;
  }
  speed = options.speed || 250;
  mouseEnabled = options.mouseEnabled || true;
  delay = options.auto || 0;
  swipeWrap = swipeContainer.children[0];

  offloadFn = function(fn) {
    if (fn) {
      setTimeout(fn, 1);
    }
  };
  isMouseEvent = function(evt) {
    return /^mouse/.test(evt.type);
  };
  transitionEndEvt = (function() {
    var style = (document.body || document.documentElement).style;
    if (style.transition !== undefined) {
      return 'transitionend';
    }
    if (style.msTransition !== undefined) {
      return 'msTransitionEnd';
    }
    if (style.WebkitTransition !== undefined) {
      return 'webkitTransitionEnd';
    }
    return '';
  })();

  hasTouchSupport = (function() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  })();

  start = Object.create(null);
  delta = Object.create(null);
  events = {
    handleEvent : function(event) {
      if (!isSwipable(event.target)) {
        return;
      }
      switch (event.type) {
        case 'mousedown':
        case 'touchstart':
          this.start(event);
          break;
        case 'mousemove':
        case 'touchmove':
          this.move(event);
          break;
        case 'mouseup':
        case 'mouseleave':
        case 'touchend':
          offloadFn(this.end(event));
          break;
        case transitionEndEvt:
          offloadFn(this.transitionEnd(event));
          break;
        case 'resize':
          offloadFn(setup);
          break;
      }
      if (options.stopPropagation) {
        event.stopPropagation();
      }
    },
    start : function(event) {
      var touches;
      if (isMouseEvent(event)) {
        touches = event;
        event.preventDefault();
      } else {
        touches = event.touches[0];
      }
      start = {
        x : touches.pageX,
        y : touches.pageY,
        time : new Date().getTime()
      };
      isScrolling = undefined;
      delta = Object.create(null);

      if (isMouseEvent(event)) {
        swipeWrap.addEventListener('mousemove', this, false);
        swipeWrap.addEventListener('mouseup', this, false);
        swipeWrap.addEventListener('mouseleave', this, false);
      } else {
        swipeWrap.addEventListener('touchmove', this, false);
        swipeWrap.addEventListener('touchend', this, false);
      }
    },
    move : function(event) {
      var touches;
      if (isMouseEvent(event)) {
        touches = event;
      } else {
        if (event.touches.length > 1 || event.scale && event.scale !== 1) {
          return;
        }
        if (options.disableScroll) {
          event.preventDefault();
        }
        touches = event.touches[0];
      }
      delta = {
        x : touches.pageX - start.x,
        y : touches.pageY - start.y
      };
      if (typeof isScrolling === 'undefined') {
        isScrolling = isScrolling || Math.abs(delta.x) < Math.abs(delta.y);
      }
      if (!isScrolling) {
        event.preventDefault();
        stop();
        if (options.continuous) {
          translate(circle(index - 1), delta.x + slidePos[circle(index - 1)], 0);
          translate(index, delta.x + slidePos[index], 0);
          translate(circle(index + 1), delta.x + slidePos[circle(index + 1)], 0);
        } else {
          delta.x = delta.x / (!index && delta.x > 0 || index === slides.length - 1 && delta.x < 0 ? Math.abs(delta.x) / width + 1 : 1);
          translate(index - 1, delta.x + slidePos[index - 1], 0);
          translate(index, delta.x + slidePos[index], 0);
          translate(index + 1, delta.x + slidePos[index + 1], 0);
        }
      }
    },
    end : function(event) {
      var duration, isValidSlide, isPastBounds, direction;
      duration = new Date().getTime() - start.time;
      isValidSlide = Number(duration) < 250 && Math.abs(delta.x) > 20 || Math.abs(delta.x) > width / 2;
      isPastBounds = !index && delta.x > 0 || index === slides.length - 1 && delta.x < 0;
      if (options.continuous) {
        isPastBounds = false;
      }
      direction = delta.x < 0;
      if (!isScrolling) {
        if (isValidSlide && !isPastBounds) {
          if (direction) {
            if (options.continuous) {
              move(circle(index - 1), -width, 0);
              move(circle(index + 2), width, 0);

            } else {
              move(index - 1, -width, 0);
            }
            move(index, slidePos[index] - width, speed);
            move(circle(index + 1), slidePos[circle(index + 1)] - width, speed);
            index = circle(index + 1);
          } else {
            if (options.continuous) {
              move(circle(index + 1), width, 0);
              move(circle(index - 2), -width, 0);
            } else {
              move(index + 1, width, 0);
            }
            move(index, slidePos[index] + width, speed);
            move(circle(index - 1), slidePos[circle(index - 1)] + width, speed);
            index = circle(index - 1);
          }
          if (options.callback) {
            options.callback(index, slides[index]);
          }
        } else {
          if (options.continuous) {
            move(circle(index - 1), -width, speed);
            move(index, 0, speed);
            move(circle(index + 1), width, speed);
          } else {
            move(index - 1, -width, speed);
            move(index, 0, speed);
            move(index + 1, width, speed);
          }
        }
      }
      if (isMouseEvent(event)) {
        swipeWrap.removeEventListener('mousemove', events, false);
        swipeWrap.removeEventListener('mouseup', events, false);
        swipeWrap.removeEventListener('mouseleave', events, false);
      } else {
        swipeWrap.removeEventListener('touchmove', events, false);
        swipeWrap.removeEventListener('touchend', events, false);
      }
    },
    transitionEnd : function(event) {
      if (parseInt(event.target.getAttribute('data-swipe-index'), 10) === index) {
        if (delay) {
          begin();
        }
        if (options.transitionEnd) {
          options.transitionEnd.call(event, index, slides[index]);
        }
      }
    }
  };

  translate = function(_index, dist, _speed) {
    var _slide = slides[_index];
    var style = _slide && _slide.style;
    if (!style) {
      return;
    }
    style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = _speed + 'ms';
    style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
    style.msTransform = style.MozTransform = style.OTransform = 'translateX(' + dist + 'px)';
  };

  move = function(_index, dist, _speed) {
    translate(_index, dist, _speed);
    slidePos[_index] = dist;
  };

  circle = function(_index) {
    return (slides.length + _index % slides.length) % slides.length;
  };

  setup = function() {
    var _width, pos, _slide;
    _width = swipeContainer.getBoundingClientRect().width || swipeContainer.offsetWidth;
    if (!_width) {
      setTimeout(setup, 50);
      return;
    }
    if (_width === width) {
      return;
    }
    swipeContainer.style.visibility = 'hidden';
    width = _width;
    slides = swipeWrap.children;
    length = slides.length;
    if (slides.length < 2) {
      options.continuous = false;
    }
    // special case if two slides
    // if (transitionEndEvt && options.continuous && slides.length < 3) {
    // swipeWrap.appendChild(slides[0].cloneNode(true));
    // swipeWrap.appendChild(swipeWrap.children[1].cloneNode(true));
    // slides = swipeWrap.children;
    // }
    // create an array to store current positions of each slide
    slidePos = new Array(slides.length);
    // determine width of each slide
    swipeWrap.style.width = (slides.length * width).toString() + 'px';
    // stack elements
    pos = slides.length;
    while (pos--) {
      _slide = slides[pos];
      _slide.style.width = width + 'px';
      _slide.setAttribute('data-swipe-index', pos);
      if (transitionEndEvt) {
        _slide.style.left = (pos * -width).toString() + 'px';
        move(pos, index > pos ? -width : index < pos ? width : 0, 0);
      }
    }
    // reposition elements before and after index
    if (options.continuous && transitionEndEvt) {
      move(circle(index - 1), -width, 0);
      move(circle(index + 1), width, 0);
    }
    if (!transitionEndEvt) {
      swipeWrap.style.left = (index * -width).toString() + 'px';
    }
    if (!initialized && options.initialize && typeof options.initialize === 'function') {
      initialized = true;
      // thisInstance.initialize = options.initialize;
      // offloadFn(function() {
      options.initialize.apply(thisInstance, arguments);
      // });
    }
    swipeContainer.style.visibility = 'visible';
    if (!rendered && options.afterRender && typeof options.afterRender === 'function') {
      rendered = true;
      // offloadFn(function() {
      // thisInstance.afterRender = options.afterRender;
      // offloadFn(options.afterRender(index, slides[index]));
      // options.afterRender.call(this, index, slides[index]);
      // options.afterRender.call(this, arguments);
      // });
      offloadFn(function() {
        options.afterRender.call(thisInstance, index, slides[index]);
      });
    }
  };

  animate = function(from, to, _speed) {
    // if not an animation, just reposition
    if (!_speed) {
      swipeWrap.style.left = to + 'px';
      return;
    }
    var _start = new Date().getTime();
    var timer = setInterval(function() {
      var timeElap = new Date().getTime() - _start;
      if (timeElap > _speed) {
        swipeWrap.style.left = to + 'px';
        if (delay) {
          begin();
        }
        if (options.transitionEnd) {
          options.transitionEnd.call(event, index, slides[index]);
        }
        clearInterval(timer);
        return;
      }
      swipeWrap.style.left = ((to - from) * Math.floor(100 * timeElap / _speed) / 100 + from).toString() + 'px';
    }, 5);

  };

  slide = function(to, slideSpeed) {
    // do nothing if already on requested slide
    var direction, naturalDirection, diff;
    if (index === to) {
      return;
    }
    if (transitionEndEvt) {
      direction = Math.abs(index - to) / (index - to);
      // 1: backward, -1: forward
      // get the actual position of the slide
      if (options.continuous) {
        naturalDirection = direction;
        direction = -slidePos[circle(to)] / width;
        // if going forward but to < index, use to = slides.length + to
        // if going backward but to > index, use to = -slides.length + to
        if (direction !== naturalDirection) {
          to = -direction * slides.length + to;
        }
      }
      diff = Math.abs(index - to) - 1;
      // move all the slides between index and to in the right direction
      while (diff--) {
        move(circle((to > index ? to : index) - diff - 1), width * direction, 0);
      }
      to = circle(to);
      move(index, width * direction, slideSpeed || speed);
      move(to, 0, slideSpeed || speed);

      if (options.continuous) {
        move(circle(to - direction), -width * direction, 0);
      }
      // we need to get the next in place
    } else {
      to = circle(to);
      animate(index * -width, to * -width, slideSpeed || speed);
      // no fallback for a circular continuous if the browser does not accept
      // transitions
    }
    index = to;
    offloadFn(options.callback && options.callback(index, slides[index]));
  };
  prev = function() {
    if (options.continuous) {
      slide(index - 1);
    } else if (index) {
      slide(index - 1);
    }
  };

  next = function() {
    if (options.continuous) {
      slide(index + 1);
    } else if (index < slides.length - 1) {
      slide(index + 1);
    }
  };

  begin = function() {
    interval = setTimeout(next, delay);
  };

  stop = function() {
    delay = 0;
    clearTimeout(interval);
  };

  setup();
  if (delay) {
    begin();
  }
  if (hasTouchSupport) {
    if (document.documentMode || /Edge/.test(navigator.userAgent)) {
      swipeWrap.addEventListener('touchstart', events, false);
    } else {
      swipeWrap.addEventListener('touchstart', events, {passive: true});
    }
    // swipeWrap.addEventListener('touchstart', events, false);
  }
  if (mouseEnabled) {
    swipeWrap.addEventListener('mousedown', events, false);
  }
  if (transitionEndEvt) {
    swipeWrap.addEventListener(transitionEndEvt, events, false);
  }
  window.addEventListener('resize', events, false);

  thisInstance = {
    setup : function() {
      setup();
    },
    slide : function(to, _speed) {
      stop();
      slide(to, _speed);
    },
    prev : function() {
      stop();
      prev();
    },
    next : function() {
      stop();
      next();
    },
    stop : function() {
      stop();
    },
    getPos : function() {
      return index;
    },
    getSlide : function() {
      return slides[index];
    },
    getNumSlides : function() {
      return length;
    },
    destroy : function() {
      var pos;
      stop();
      swipeWrap.style.width = 'auto';
      swipeWrap.style.left = 0;
      pos = slides.length;
      while (pos--) {
        var _slide = slides[pos];
        _slide.style.width = 'auto';
        _slide.style.left = 0;
        if (transitionEndEvt) {
          translate(pos, 0, 0);
        }
      }
      if (hasTouchSupport) {
        if (document.documentMode || /Edge/.test(navigator.userAgent)) {
          swipeWrap.removeEventListener('touchstart', events, false);
        } else {
          swipeWrap.removeEventListener('touchstart', events, {passive: true});
        }
        // swipeWrap.removeEventListener('touchstart', events, false);
      }
      if (mouseEnabled) {
        swipeWrap.removeEventListener('mousedown', events, false);
      }
      if (transitionEndEvt) {
        swipeWrap.removeEventListener(transitionEndEvt, events, false);
      }
      window.removeEventListener('resize', events, false);
    }
  };
  return thisInstance;
}
