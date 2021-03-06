// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'

import App from './components/app/app'

import router from './router'
import store from './vuex/store'

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  render (h) {
    return (<App/>)
  },
  components: { App }
})

// needed for an abstract router
router.replace('/')
