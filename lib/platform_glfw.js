const events = require('events');
const {EventEmitter} = events;
const fs = require('fs');

const GLFW = require('node-glfw2');
const WebGL = require('./webgl');

module.exports = function () {
  let platform;
  let win;

  let localEvents = null;
  Object.defineProperty(GLFW, 'events', {
    get: function () {
      if (!localEvents) {
        localEvents = new EventEmitter();
        const {emit} = localEvents;
        localEvents.emit = function() {
          emit.apply(localEvents, arguments);
        };
      }

      return localEvents;
    },
    // enumerable: true,
    // configurable: true
  });

  GLFW.Init();
  //	GLFW.events.on('event', console.dir);
  /* GLFW.events.on('keydown', function (evt) {
    if (evt.keyCode === 'C'.charCodeAt(0) && evt.ctrlKey) { process.exit(0); }// Control+C
    if (evt.keyCode === 27) process.exit(0);	// ESC
  }); r*/

  platform = {
    tagName: 'CANVAS',
    setTitle: function(title) {
      GLFW.SetWindowTitle(win, title);
    },
    setCursor: function(enabled) {
      GLFW.SetInputMode(win, GLFW.CURSOR, enabled ? GLFW.CURSOR_NORMAL : GLFW.CURSOR_DISABLED);
    },
    setCursorPos: function(x, y) {
      GLFW.SetCursorPos(win, x, y);
    },
    flip: function() {
      GLFW.SwapBuffers(win);
    },
    pollEvents: function() {
      GLFW.PollEvents();
    },
    createElement: function(name, width, height) {
      if (name.toLowerCase() === 'native-canvas') {
        this.createWindow(width || 1280, height || 1024);
        this.canvas = this;
        WebGL.canvas = this;
        return this;
      }
      return null;
    },
    requestPointerLock: function() {
      if (this.pointerLockElement === null) {
        this.setCursor(false);
        this.pointerLockElement = this;
        this.emit('pointerlockchange');
      }
    },
    exitPointerLock: function() {
      if (this.pointerLockElement !== null) {
        this.setCursor(true);
        this.pointerLockElement = null;
        this.emit('pointerlockchange');
      }
    },
    createWindow: function(width, height) {
      /* var attribs = GLFW.WINDOW;

      if (width == 0 || height == 0) {
          attribs = GLFW.FULLSCREEN;
          width = height = 0;
      } */

      /* var resizeListeners = [], rl = GLFW.events.listeners('framebuffer_resize');
      for (var l = 0, ln = rl.length; l < ln; ++l) {
        resizeListeners[l] = rl[l];
      }
      GLFW.events.removeAllListeners('framebuffer_resize'); */

      GLFW.DefaultWindowHints();

      // we use OpenGL 2.1, GLSL 1.20. Comment this for now as this is for GLSL 1.50
      //GLFW.OpenWindowHint(GLFW.OPENGL_FORWARD_COMPAT, 1);
      //GLFW.OpenWindowHint(GLFW.OPENGL_VERSION_MAJOR, 3);
      //GLFW.OpenWindowHint(GLFW.OPENGL_VERSION_MINOR, 2);
      //GLFW.OpenWindowHint(GLFW.OPENGL_PROFILE, GLFW.OPENGL_CORE_PROFILE);
      GLFW.WindowHint(GLFW.RESIZABLE, 1);
      GLFW.WindowHint(GLFW.VISIBLE, 1);
      GLFW.WindowHint(GLFW.DECORATED, 1);
      GLFW.WindowHint(GLFW.RED_BITS, 8);
      GLFW.WindowHint(GLFW.GREEN_BITS, 8);
      GLFW.WindowHint(GLFW.BLUE_BITS, 8);
      GLFW.WindowHint(GLFW.DEPTH_BITS, 24);
      GLFW.WindowHint(GLFW.REFRESH_RATE, 0);
      /* if (samples > 1) {
        GLFW.WindowHint(GLFW.SAMPLES, samples);
      } */

      win = GLFW.CreateWindow(width, height);

      GLFW.MakeContextCurrent(win);

      GLFW.SetWindowTitle(win, 'WebGL');

      // make sure GLEW is initialized
      WebGL.Init();

      GLFW.SwapBuffers(win);
      GLFW.SwapInterval(0); // Disable VSync (we want to get as high FPS as possible!)

      /* for (let l = 0, ln = resizeListeners.length; l < ln; ++l) {
        GLFW.events.addListener('framebuffer_resize', resizeListeners[l]);
      } */

      this.pointerLockElement = null;

      const sizeFB = GLFW.GetFramebufferSize(win);
      const sizeWin = GLFW.GetWindowSize(win);
      this.width = sizeFB.width;
      this.height = sizeFB.height;
      this.style = {
        width: this.width,
        height: this.height,
      };
      // this.ratio = sizeFB.width / sizeWin.width;

      // GLFW.Terminate();
    },
    getRenderTarget: function(width, height, samples) {
      return GLFW.GetRenderTarget(width, height, samples);
    },
    bindFrameBuffer: function(fbo) {
      GLFW.BindFrameBuffer(fbo);
    },
    blitFrameBuffer: function(fbo1, fbo2, sw, sh, dw, dh) {
      GLFW.BlitFrameBuffer(fbo1, fbo2, sw, sh, dw, dh);
    },
    getContext: function(name) {
      return WebGL;
    },
    on: function(name, callback) {
      this.addEventListener(name,callback);
    },
    emit: function(name, event) {
      GLFW.events.emit(name, event);
    },
    addEventListener: function(name, callback) {
      if (callback && typeof callback === 'function') {
        if (name === 'resize') {
          name = 'framebuffer_resize';
          var tmpcb=callback;
          var self=callback.this;
          callback = evt => {
            this.width = evt.width;
            this.height = evt.height;
            this.style.width = this.width;
            this.style.height = this.height;
            tmpcb.call(self,evt);
          };
        } else if (name === 'mousemove') {
          var tmpcb=callback;
          var self=callback.this;
          callback = evt => {
            /* evt.x *= this.ratio;
            evt.y *= this.ratio;
            evt.clientX *= this.ratio;
            evt.clientY *= this.ratio;
            evt.pageX *= this.ratio;
            evt.pageY *= this.ratio; */
            if (this.pointerLockElement) {
              evt.movementX = evt.pageX - (parseInt(this.style.width, 10) / 2); // XXX do not use parseInt
              evt.movementY = evt.pageY - (parseInt(this.style.height, 10) / 2);
            }
            tmpcb.call(self,evt);

            if (this.pointerLockElement) {
              this.setCursorPos(parseInt(this.style.width, 10) / 2, parseInt(this.style.height, 10) / 2);
            }
          };
        } else if (name === 'mousedown' || name === 'mouseup') {
          var tmpcb=callback;
          var self=callback.this;
          callback = evt => {
            /* evt.x *= this.ratio;
            evt.y *= this.ratio;
            evt.clientX *= this.ratio;
            evt.clientY *= this.ratio;
            evt.pageX *= this.ratio;
            evt.pageY *= this.ratio; */
            tmpcb.call(self,evt);
          };
        } else if (name === 'drop') {
          var tmpcb=callback;
          var self=callback.this;
          callback = paths => {
            Promise.all(paths.map(path => new Promise((accept, reject) => {
              fs.readFile(path, (err, data) => {
                if (!err) {
                  accept(new Blob([data]));
                } else {
                  reject(err);
                }
              });
            })))
              .then(datas => {
                tmpcb.call(self, datas);
              })
              .catch(err => {
                console.warn(err);
              });
          };
        }
        GLFW.events.on(name, callback);
      }
    },
    removeEventListener: function(name, callback) {
      if (callback && typeof callback === 'function') {
        if(name === 'resize') {
          name = 'framebuffer_resize';
        }
        GLFW.events.removeListener(name, callback);
      }
    },
  };
    }
  });
  });
  });

  return platform;
};

