const ytTweaks = window.ytTweaks = {
  injector: null,
  userTweaksConfiguration: [],

  baseClass: 'yt-tweaks',
  baseAttribute: 'yt-tweaks',

  initialized: false,
  registeredTweaks: new Map(),
  running: false,

  mainWaitCancel: () => {},

  configure(config) {
    this.log('recieve configuration', config, this.registeredTweaks.size);
    this.userTweaksConfiguration = config;


    this.waitForAngularAndRun();
  },

  getConfigsForTweak(name) {
    return this.userTweaksConfiguration.filter(c => (c.type === name && !c.disabled));
  },

  inject(...args) {
    const result = {};
    let lastDI;
    args.forEach(di => {
      lastDI = result[di] = this.injector.get(di);
    });

    return args.length === 1 ? lastDI : result;
  },

  registerTweak(tweak) {
    this.registeredTweaks.set(tweak.name, tweak);
  },

  runTweaks() {
    this.registeredTweaks.forEach(tweak => {
      this.log('running tweak', tweak.name);
      tweak.run();
    });
  },

  stopTweaks() {
    this.mainWaitCancel();

    this.registeredTweaks.forEach(tweak => {
      if (tweak.stop) {
        this.log('stopping tweak', tweak.name);
        tweak.stop();
      }
    });
    this.running = false;
  },

  mockMethod(object, propertyName, mockFn) {
    const original = object[propertyName];
    object[propertyName] = (...args) => {
      const originalResult = original(...args);
      mockFn(originalResult, ...args);
      return originalResult;
    };

    return () => object[propertyName] = original;
  },

  waitNum: 0,
  wait(waitFn, successFn, errorFn, name = this.waitNum++) {
    this.log('wait created', name);

    const interval = window.setInterval(() => {
      this.log('wait iteration', name);
      const result = waitFn();

      if (result) {
        this.log('wait successfully finished', name);
        window.clearInterval(interval);
        successFn(result);
      } else {
        errorFn && errorFn();
      }
    }, 500);

    return () => window.clearInterval(interval);
  },

  waitForAngularAndRun() {
    if (this.running) {
      ytTweaks.error('already running');
      return;
    }
    this.running = true;

    this.mainWaitCancel = this.wait(() => window.angular, angular => {
      this.injector = angular.element(document.body).injector();
      if (this.injector) {
        if (!this.initialized) {
          this.init();
          this.initialized = true;
        }

        this.runTweaks();
      } else {
        ytTweaks.error('injector unreachable')
      }
    }, null, 'angular');
  },

  removeNodes(selector, element = document) {
    element.querySelectorAll(selector).forEach(node => {
      node.parentNode.removeChild(node);
    });
  },

  trimmedSplit(str = '', separator = ',') {
    return str.split(separator).map(v => v.trim()).filter(v => v);
  },

  inArray(arr, str, emptyArrayAsTrue = false) {
    return (arr.indexOf(str) !== -1) || (emptyArrayAsTrue && arr.length === 0);
  },

  log(...args) {
    console.log('YouTrack Tweaks:', ...args);
  },

  error(...args) {
    console.error('YouTrack Tweaks:', ...args);
  },

  storage(type) {
    return {
      set: (itemKey, itemData) => window[`${type}Storage`].setItem(itemKey, JSON.stringify(itemData)),
      get: itemKey => JSON.parse(window[`${type}Storage`].getItem(itemKey)),
      removeItem: itemKey => window[`${type}Storage`].removeItem(itemKey)
    };
  },

  init() {
    const rerun = () => {
      ytTweaks.stopTweaks();
      ytTweaks.runTweaks();
    };

    // process browser back/forward buttons
    window.addEventListener('popstate', rerun);

    // process angular routes
    this.inject('$rootScope').$on('$routeChangeSuccess', rerun);
  }
};