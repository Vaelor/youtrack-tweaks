import Vue from 'vue'
import Router from 'vue-router'

import List from '../components/list-page/list.vue'
import EditPage from '../components/edit-page/edit-page.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'list',
      component: List
    },
    {
      path: '/edit/:index',
      name: 'edit',
      component: EditPage
    }
  ]
})
